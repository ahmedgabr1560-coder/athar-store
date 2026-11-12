const { safeEqual, isSameOrigin } = require('../lib/admin-auth');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isSameOrigin(req)) return res.status(403).json({ error: 'طلب غير مسموح' });

  const id = String(req.body && req.body.id || '').toUpperCase();
  const phone = String(req.body && req.body.phone || '').replace(/\D/g, '');
  if (!/^ATH-[A-F0-9]{10}$/.test(id) || !/^01\d{9}$/.test(phone)) {
    return res.status(404).json({ error: 'لم يتم العثور على الطلب' });
  }

  try {
    const { get } = await import('@vercel/blob');
    const file = await get(`orders/${id}.json`, { access: 'private' });
    if (!file || file.statusCode !== 200) return res.status(404).json({ error: 'لم يتم العثور على الطلب' });
    const order = JSON.parse(await new Response(file.stream).text());
    const storedPhone = String(order.customer && order.customer.phone || '').replace(/\D/g, '');
    if (!safeEqual(phone, storedPhone)) return res.status(404).json({ error: 'لم يتم العثور على الطلب' });

    return res.status(200).json({
      id: order.id,
      items: order.items,
      total: order.total,
      status: order.status,
      date: order.date,
      dates: order.dates,
    });
  } catch (error) {
    return res.status(404).json({ error: 'لم يتم العثور على الطلب' });
  }
};
