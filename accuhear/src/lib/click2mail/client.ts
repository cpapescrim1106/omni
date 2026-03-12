import { getClick2MailConfig } from "@/lib/click2mail/config";

type RequestOptions = {
  method?: "GET" | "POST";
  path: string;
  form?: URLSearchParams;
  headers?: HeadersInit;
};

function getAuthHeader(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`;
}

export async function click2MailRequest({ method = "GET", path, form, headers }: RequestOptions) {
  const config = getClick2MailConfig();
  const response = await fetch(`${config.baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
    method,
    headers: {
      Authorization: getAuthHeader(config.username, config.password),
      Accept: "application/xml",
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...headers,
    },
    body: form,
    cache: "no-store",
  });

  const text = await response.text().catch(() => "");
  if (!response.ok) {
    throw new Error(`Click2Mail request failed (${response.status}): ${text}`.trim());
  }

  return text;
}

export async function getClick2MailCreditBalance() {
  const xml = await click2MailRequest({ path: "/credit" });
  const balanceMatch = xml.match(/<balance>([^<]+)<\/balance>/i);
  const allowNegativeMatch = xml.match(/<allowNegative>([^<]+)<\/allowNegative>/i);

  return {
    raw: xml,
    balance: balanceMatch ? Number(balanceMatch[1]) : null,
    allowNegative: allowNegativeMatch ? allowNegativeMatch[1].toLowerCase() === "true" : null,
  };
}
