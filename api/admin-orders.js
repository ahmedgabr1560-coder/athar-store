const { hasAdminSession, isSameOrigin } = require('../lib/admin-auth');
const VALID_STATUSES = new Set(['pending', 'confirmed', 'shipping', 'delivered', 'cancelled']);

async function readAllOrders() {
  const { list, get } = await import('@vercel/blob');
  const orders = [];
  let cursor;
  do {
    const page = await list({ prefix: 'orders/', cursor, limit: 1000 });
    for (const blob of page.blobs || []) {
      if (!/^orders\/ATH-[A-F0-9]{10}\.json$/.test(blob.pathname)) continue;
      const file = await get(blob.pathname, { access: 'private' });
      if (!file || file.statusCode !== 200) continue;
      try {
        const order = JSON.parse(await new Response(file.stream).text());
        if (order && order.id && order.customer) orders.push(order);
      } catch {}
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!hasAdminSession(req)) return res.status(401).json({ error: 'يلزم تسجيل الدخول' });

  if (req.method === 'GET') {
    try {
      return res.status(200).json({ orders: await readAllOrders() });
    } catch (error) {
      return res.status(500).json({ error: 'تعذر تحميل الطلبات الخاصة' });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isSameOrigin(req)) return res.status(403).json({ error: 'طلب غير مسموح' });

  try {
    const { put } = await import('@vercel/blob');
    const submitted = Array.isArray(req.body && req.body.orders) ? req.body.orders : null;
    if (!submitted || submitted.length > 1000) return res.status(400).json({ error: 'قائمة الطلبات غير صالحة' });

    const existing = await readAllOrders();
    const updates = new Map(submitted.map(order => [String(order.id || ''), order]));
    let updated = 0;
    for (const order of existing) {
      const requested = updates.get(order.id);
      if (!requested || !VALID_STATUSES.has(requested.status) || requested.status === order.status) continue;
      order.status = requested.status;
      order.updatedAt = Date.now();
      const statusStep = { confirmed: 1, shipping: 2, delivered: 3 }[requested.status];
      if (statusStep) {
        order.dates = Array.isArray(order.dates) ? order.dates : ['', '', '', ''];
        order.dates[statusStep] = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
      }
      await put(`orders/${order.id}.json`, JSON.stringify(order), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      });
      updated += 1;
    }
    return res.status(200).json({ success: true, updated });
  } catch (error) {
    return res.status(500).json({ error: 'تعذر حفظ تحديثات الطلبات الخاصة' });
  }
};
