import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "mm_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const ISSUER = "marco-mayor-admin";

export type SessionPayload = { sub: string };

function getKey(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export function isSessionConfigured() {
  return getKey() !== null;
}

export async function signSession(username: string): Promise<string> {
  const key = getKey();
  if (!key) throw new Error("SESSION_SECRET ausente ou com menos de 32 caracteres.");
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(key);
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  const key = getKey();
  const username = process.env.ADMIN_USERNAME;
  if (!token || !key || !username) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"], issuer: ISSUER });
    // Rotating ADMIN_USERNAME invalidates existing sessions.
    if (payload.sub !== username) return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}
