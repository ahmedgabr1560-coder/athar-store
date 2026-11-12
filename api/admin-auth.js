const { safeEqual, isSameOrigin, hasAdminSession, issueCookie, clearCookie } = require('../lib/admin-auth');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'GET') {
    return res.status(200).json({ authenticated: hasAdminSession(req) });
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isSameOrigin(req)) return res.status(403).json({ error: 'طلب غير مسموح' });

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearCookie(req));
    return res.status(200).json({ success: true });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !process.env.ADMIN_SESSION_SECRET) {
    return res.status(503).json({ error: 'إعداد دخول لوحة الإدارة غير مكتمل' });
  }

  const password = req.body && typeof req.body.password === 'string' ? req.body.password : '';
  if (!safeEqual(password, expected)) return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });

  const cookie = issueCookie(req);
  if (!cookie) return res.status(503).json({ error: 'إعداد الجلسة غير مكتمل' });
  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ success: true });
};
