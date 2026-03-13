import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SALT_BYTES = 16;
const KEY_BYTES = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES).toString("base64url");
  const derived = (await scrypt(password, salt, KEY_BYTES)) as Buffer;
  return `scrypt:${salt}:${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, expected] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !expected) {
    return false;
  }

  const derived = (await scrypt(password, salt, KEY_BYTES)) as Buffer;
  const expectedBuffer = Buffer.from(expected, "base64url");
  if (derived.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derived, expectedBuffer);
}
