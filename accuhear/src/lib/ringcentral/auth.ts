type TokenCache = {
  accessToken: string;
  expiresAtMs: number;
};

let cache: TokenCache | null = null;

function requireEnv(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var ${key}`);
  return value;
}

export function clearTokenCache() {
  cache = null;
}

export async function getRingCentralToken(): Promise<string> {
  const now = Date.now();
  // Refresh with a small buffer to avoid edge-of-expiry failures.
  if (cache && now < cache.expiresAtMs - 60_000) return cache.accessToken;

  const clientId = requireEnv("RC_CLIENT_ID");
  const clientSecret = requireEnv("RC_CLIENT_SECRET");
  const serverUrl = requireEnv("RC_SERVER_URL").replace(/\/+$/, "");
  const jwt = requireEnv("RC_JWT_TOKEN");

  const url = `${serverUrl}/restapi/oauth/token`;
  const body = new URLSearchParams();
  body.set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  body.set("assertion", jwt);

  const basic = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`RingCentral token exchange failed (${response.status}): ${text}`.trim());
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    token_type?: string;
  };

  if (!payload.access_token) throw new Error("RingCentral token exchange returned no access_token");

  const expiresInSeconds = Number(payload.expires_in ?? 3600);
  cache = {
    accessToken: payload.access_token,
    expiresAtMs: now + Math.max(60, expiresInSeconds) * 1000,
  };

  return cache.accessToken;
}

