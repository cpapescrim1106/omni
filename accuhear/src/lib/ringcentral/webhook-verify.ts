import crypto from "node:crypto";

function timingSafeEqualString(a: string, b: string) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function getValidationToken(headers: Headers) {
  return headers.get("Validation-Token");
}

function normalizeSignature(value: string) {
  // Some providers prefix the signature with an algorithm (e.g. "sha1=<digest>").
  // Do not split arbitrary base64 strings on "=", since base64 commonly includes padding.
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("sha1=") || lower.startsWith("sha256=")) {
    return trimmed.slice(trimmed.indexOf("=") + 1).trim();
  }
  return trimmed;
}

function computeHmacBase64(rawBody: string, secret: string, algorithm: "sha1" | "sha256") {
  return crypto.createHmac(algorithm, secret).update(rawBody, "utf8").digest("base64");
}

export function verifyRingCentralSignature(options: {
  rawBody: string;
  signatureHeader: string | null;
  secret: string;
}) {
  const { rawBody, signatureHeader, secret } = options;
  if (!signatureHeader) return false;
  const provided = normalizeSignature(signatureHeader);

  // RingCentral signature algo varies by docs/SDKs; accept sha1 or sha256 to avoid brittle breakage.
  const expectedSha1 = computeHmacBase64(rawBody, secret, "sha1");
  if (provided.length === expectedSha1.length && timingSafeEqualString(provided, expectedSha1)) return true;

  const expectedSha256 = computeHmacBase64(rawBody, secret, "sha256");
  if (provided.length === expectedSha256.length && timingSafeEqualString(provided, expectedSha256)) return true;

  return false;
}
