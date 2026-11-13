const crypto = require('crypto');

const COOKIE_NAME = '__Host-scum_panel';
const SESSION_MS = 8 * 60 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return (Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '').split(',')[0]).trim() || 'unknown';
}
function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
function cookieValue(req) {
  const raw = String(req.headers.cookie || '');
  const entry = raw.split(';').map(v => v.trim()).find(v => v.startsWith(COOKIE_NAME + '='));
  return entry ? entry.slice(COOKIE_NAME.length + 1) : '';
}
function validSession(token, secret) {
  if (!token || !secret) return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const expiresAt = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!/^\\d{13}$/.test(expiresAt) || Number(expiresAt) <= Date.now()) return false;
  const expected = crypto.createHmac('sha256', secret).update(expiresAt).digest();
  let supplied;
  try { supplied = Buffer.from(signature, 'hex'); } catch { return false; }
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  const accessKey = process.env.PANEL_ACCESS_KEY;
  const sessionSecret = process.env.PANEL_SESSION_SECRET;
  if (!accessKey || !sessionSecret) {
    return res.status(503).json({ ok: false, error: 'auth_not_configured' });
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const record = attempts.get(ip);
  if (record && now - record.startedAt < WINDOW_MS && record.count >= MAX_ATTEMPTS) {
    return res.status(429).json({ ok: false, error: 'rate_limited' });
  }
  if (!record || now - record.startedAt >= WINDOW_MS) attempts.set(ip, { startedAt: now, count: 0 });

  const supplied = req.body && typeof req.body.key === 'string' ? req.body.key : '';
  if (!safeEqual(supplied, accessKey)) {
    attempts.get(ip).count += 1;
    return res.status(401).json({ ok: false, error: 'invalid_key' });
  }

  attempts.delete(ip);
  const expiresAt = now + SESSION_MS;
  const signature = crypto.createHmac('sha256', sessionSecret).update(String(expiresAt)).digest('hex');
  const token = String(expiresAt) + '.' + signature;
  res.setHeader('Set-Cookie', COOKIE_NAME + '=' + token + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800');
  return res.status(200).json({ ok: true });
};
