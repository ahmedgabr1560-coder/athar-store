module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password, products } = req.body || {};

    const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'athar2026';
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.REPO_OWNER || 'ahmedgabr1560-coder';
    const REPO_NAME = process.env.REPO_NAME || 'athar-store';
    const FILE_PATH = 'data/products.json';

    if (!password || password !== ADMIN_PASS) {
      return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
    }

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'بيانات المنتجات غير صالحة' });
    }

    if (!GITHUB_TOKEN) {
      return res.status(500).json({
        error: 'GITHUB_TOKEN غير مضبوط على Vercel. أضفه من Project Settings → Environment Variables'
      });
    }

    const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'ATHAR-Admin'
      }
    });

    let sha = null;
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    } else if (getRes.status !== 404) {
      const errText = await getRes.text();
      return res.status(500).json({ error: 'فشل قراءة الملف من GitHub', details: errText });
    }

    const content = Buffer.from(JSON.stringify(products, null, 2), 'utf8').toString('base64');

    const putRes = await fetch(getUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'ATHAR-Admin'
      },
      body: JSON.stringify({
        message: `Update products via admin panel (${products.length} items)`,
        content,
        branch: 'main',
        ...(sha ? { sha } : {})
      })
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      return res.status(500).json({ error: 'فشل حفظ المنتجات على GitHub', details: errText });
    }

    const result = await putRes.json();
    return res.status(200).json({
      success: true,
      message: 'تم حفظ المنتجات على GitHub. Vercel هيحدّث الموقع خلال دقيقة.',
      commit: result.commit?.sha || null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'خطأ غير متوقع' });
  }
};
