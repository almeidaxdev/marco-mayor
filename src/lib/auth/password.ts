import "server-only";
import { createHash, scrypt, timingSafeEqual, type BinaryLike, type ScryptOptions } from "node:crypto";

/**
 * Hash format: scrypt:<N>:<r>:<p>:<salt base64url>:<hash base64url>
 * Colon-separated on purpose: `$` would be expanded by dotenv in .env files.
 * Generate with `npm run hash-password`.
 */
function scryptAsync(password: BinaryLike, salt: BinaryLike, keylen: number, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keylen, options, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, saltB64, hashB64] = parts;
  const N = Number(n);
  const R = Number(r);
  const P = Number(p);
  if (![N, R, P].every(Number.isInteger) || N < 16384 || R < 8 || P < 1) return false;

  const salt = Buffer.from(saltB64, "base64url");
  const expected = Buffer.from(hashB64, "base64url");
  if (salt.length < 16 || expected.length < 32) return false;

  const derived = await scryptAsync(password.normalize("NFKC"), salt, expected.length, {
    N,
    r: R,
    p: P,
    maxmem: 256 * N * R,
  });
  return timingSafeEqual(derived, expected);
}

export function safeEqualStrings(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
