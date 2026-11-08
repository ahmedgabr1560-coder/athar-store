module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const order = req.body;
    if (!order || !order.id || !order.customer) {
      return res.status(400).json({ error: 'بيانات الطلب غير مكتملة' });
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.REPO_OWNER || 'ahmedgabr1560-coder';
    const REPO_NAME = process.env.REPO_NAME || 'athar-store';
    const FILE_PATH = 'data/orders.json';

    if (!GITHUB_TOKEN) {
      return res.status(200).json({ success: true, message: 'تم استلام الطلب (محلي)', localOnly: true });
    }

    const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ATHAR-Store'
    };

    let orders = [];
    let sha = null;
    const getRes = await fetch(getUrl, { headers });
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      try {
        orders = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));
        if (!Array.isArray(orders)) orders = [];
      } catch { orders = []; }
    }

    orders.unshift(order);
    if (orders.length > 200) orders = orders.slice(0, 200);

    const content = Buffer.from(JSON.stringify(orders, null, 2), 'utf8').toString('base64');
    const putRes = await fetch(getUrl, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `New order ${order.id}`,
        content,
        branch: 'main',
        ...(sha ? { sha } : {})
      })
    });

    if (!putRes.ok) {
      return res.status(500).json({ error: 'فشل حفظ الطلب', details: await putRes.text() });
    }
    return res.status(200).json({ success: true, message: 'تم حفظ الطلب', orderId: order.id });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'خطأ' });
  }
};
