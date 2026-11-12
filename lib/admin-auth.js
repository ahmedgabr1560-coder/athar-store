const crypto = require('node:crypto');

const COOKIE_NAME = 'athar_admin_session';
const SESSION_SECONDS = 12 * 60 * 60;

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

function isSameOrigin(req) {
  const origin = req.headers.origin;
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = String(forwardedHost || req.headers.host || '').split(',')[0].trim();
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

function sessionToken(expiry) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;
  const payload = String(expiry);
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function hasAdminSession(req) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return false;
  let token;
  try { token = decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1)); }
  catch { return false; }
  const separator = token.indexOf('.');
  if (separator < 1) return false;
  const expiryText = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expiry = Number(expiryText);
  if (!Number.isSafeInteger(expiry) || expiry <= Math.floor(Date.now() / 1000)) return false;
  const expected = crypto.createHmac('sha256', secret).update(expiryText).digest('base64url');
  return safeEqual(signature, expected);
}

function issueCookie(req) {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const token = sessionToken(expiry);
  if (!token) return null;
  const secure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure ? '; Secure' : ''}`;
}

function clearCookie(req) {
  const secure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
  return `${COOKIE_NAME}=; Path=/api; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;
}

module.exports = { COOKIE_NAME, SESSION_SECONDS, safeEqual, isSameOrigin, hasAdminSession, issueCookie, clearCookie };
