const jwt = require('jsonwebtoken');

function signJwt(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyJwt(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return jwt.verify(token, secret);
}

function cookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  const secureOverride = typeof process.env.COOKIE_SECURE === 'string'
    ? process.env.COOKIE_SECURE === 'true'
    : undefined;
  const secureFlag = typeof secureOverride === 'boolean' ? secureOverride : isProduction;
  const maxAgeMs = parseExpiresToMs(process.env.JWT_EXPIRES_IN) || 60 * 60 * 1000;
  return {
    httpOnly: true,
    secure: secureFlag,
    sameSite: 'strict',
    path: '/',
    maxAge: maxAgeMs,
  };
}

function parseExpiresToMs(v) {
  if (!v) return 0;
  if (/^\d+$/.test(v)) return Number(v) * 1000; // seconds
  const m = String(v).trim();
  if (m.endsWith('h')) return Number(m.slice(0, -1)) * 60 * 60 * 1000;
  if (m.endsWith('m')) return Number(m.slice(0, -1)) * 60 * 1000;
  if (m.endsWith('s')) return Number(m.slice(0, -1)) * 1000;
  return 0;
}

module.exports = { signJwt, verifyJwt, cookieOptions };


