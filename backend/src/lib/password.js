import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

function toBase64(value) {
  return Buffer.from(value).toString("base64");
}

function fromBase64(value) {
  return Buffer.from(value, "base64");
}

export function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  return `scrypt$${toBase64(salt)}$${toBase64(derivedKey)}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string") {
    return false;
  }

  const [algorithm, saltBase64, hashBase64] = storedHash.split("$");

  if (algorithm !== "scrypt" || !saltBase64 || !hashBase64) {
    return false;
  }

  const salt = fromBase64(saltBase64);
  const storedKey = fromBase64(hashBase64);
  const derivedKey = scryptSync(password, salt, storedKey.length);

  if (derivedKey.length !== storedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedKey);
}

export function isValidPassword(password) {
  return typeof password === "string" && password.trim().length >= 8;
}
