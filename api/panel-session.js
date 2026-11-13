const crypto = require('crypto');
const COOKIE_NAME = '__Host-scum_panel';

function validSession(req, secret) {
  if (!secret) return false;
  const raw = String(req.headers.cookie || '');
  const entry = raw.split(';').map(v => v.trim()).find(v => v.startsWith(COOKIE_NAME + '='));
  if (!entry) return false;
  const token = entry.slice(COOKIE_NAME.length + 1);
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const expiresAt = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!/^\d{13}$/.test(expiresAt) || Number(expiresAt) <= Date.now()) return false;
  const expected = crypto.createHmac('sha256', secret).update(expiresAt).digest();
  let supplied;
  try { supplied = Buffer.from(signature, 'hex'); } catch { return false; }
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  if (!process.env.PANEL_ACCESS_KEY || !process.env.PANEL_SESSION_SECRET) {
    return res.status(503).json({ ok: false, error: 'auth_not_configured' });
  }
  const ok = validSession(req, process.env.PANEL_SESSION_SECRET);
  return res.status(ok ? 200 : 401).json({ ok });
};
