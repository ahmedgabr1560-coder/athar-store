const { hasAdminSession, isSameOrigin } = require('../lib/admin-auth');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isSameOrigin(req)) return res.status(403).json({ error: 'طلب غير مسموح' });
  if (!hasAdminSession(req)) return res.status(401).json({ error: 'يلزم تسجيل الدخول' });

  try {
    const { products } = req.body || {};
    if (!Array.isArray(products)) return res.status(400).json({ error: 'بيانات المنتجات غير صالحة' });
    const token = process.env.GITHUB_TOKEN;
    if (!token) return res.status(503).json({ error: 'حفظ المنتجات يحتاج إلى إعداد GitHub Token في Vercel' });

    const owner = process.env.REPO_OWNER || 'ahmedgabr1560-coder';
    const repo = process.env.REPO_NAME || 'athar-store';
    const path = 'data/products.json';
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'ATHAR-Admin' };
    const current = await fetch(url, { headers });
    if (!current.ok) return res.status(502).json({ error: 'تعذر قراءة ملف المنتجات من GitHub' });
    const file = await current.json();
    const content = Buffer.from(JSON.stringify(products, null, 2), 'utf8').toString('base64');
    const saved = await fetch(url, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `Update products via admin panel (${products.length} items)`, content, sha: file.sha, branch: 'main' }),
    });
    if (!saved.ok) return res.status(502).json({ error: 'تعذر حفظ المنتجات على GitHub' });
    const result = await saved.json();
    return res.status(200).json({ success: true, message: 'تم حفظ المنتجات على GitHub', commit: result.commit && result.commit.sha || null });
  } catch (error) {
    return res.status(500).json({ error: 'حدث خطأ غير متوقع أثناء حفظ المنتجات' });
  }
};
