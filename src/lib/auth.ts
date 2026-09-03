import crypto from 'crypto';
import { NextRequest } from 'next/server';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'chandWad#sSena#2026';
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || 'votersearch-default-secret-salt-2026';

export const AUTH_COOKIE_NAME = 'admin_session';

export function verifyAdminCredentials(u: string, p: string): boolean {
  if (!u || !p) return false;
  return u.trim() === ADMIN_USERNAME.trim() && p.trim() === ADMIN_PASSWORD.trim();
}

export function createSessionToken(username: string): string {
  const payload = JSON.stringify({
    u: username,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  const b64Payload = Buffer.from(payload).toString('base64url');
  const hmac = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(b64Payload)
    .digest('base64url');
  return `${b64Payload}.${hmac}`;
}

export function verifySessionToken(token: string): { username: string } | null {
  try {
    if (!token || !token.includes('.')) return null;
    const [b64Payload, sig] = token.split('.');
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(b64Payload)
      .digest('base64url');

    if (sig !== expectedSig) return null;

    const payload = JSON.parse(
      Buffer.from(b64Payload, 'base64url').toString('utf8')
    );
    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return { username: payload.u };
  } catch {
    return null;
  }
}

export function getAdminSessionFromRequest(
  req: NextRequest
): { username: string } | null {
  const cookie = req.cookies.get(AUTH_COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifySessionToken(cookie.value);
}
