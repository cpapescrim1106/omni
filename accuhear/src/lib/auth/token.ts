const encoder = new TextEncoder();
const decoder = new TextDecoder();

type AuthTokenPayload = {
  sub: string;
  email: string;
  role: "ADMINISTRATOR" | "EMPLOYEE";
  exp: number;
};

function bytesToBase64Url(value: Uint8Array) {
  const binary = Array.from(value, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function toBase64Url(value: string) {
  return bytesToBase64Url(encoder.encode(value));
}

function fromBase64Url(value: string) {
  return decoder.decode(base64UrlToBytes(value));
}

async function importSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is required");
  }

  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(input: string) {
  const key = await importSecret();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(input));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createAuthToken(payload: Omit<AuthTokenPayload, "exp">, maxAgeSeconds: number) {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = toBase64Url(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
    } satisfies AuthTokenPayload)
  );
  const signature = await sign(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) {
    return null;
  }

  const key = await importSecret();
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(signature),
    encoder.encode(`${header}.${body}`)
  );
  if (!valid) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(body)) as Partial<AuthTokenPayload>;
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "ADMINISTRATOR" && payload.role !== "EMPLOYEE") ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}

export type { AuthTokenPayload };
