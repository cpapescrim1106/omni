function requireEnv(key: string) {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`Missing required env var ${key}`);
  return value;
}

export function isClick2MailEnabled() {
  return process.env.CLICK2MAIL_ENABLED?.toLowerCase() === "true";
}

export function getClick2MailConfig() {
  return {
    username: requireEnv("CLICK2MAIL_USERNAME"),
    password: requireEnv("CLICK2MAIL_PASSWORD"),
    baseUrl: requireEnv("CLICK2MAIL_BASE_URL").replace(/\/+$/, ""),
    defaultJobTemplateId: process.env.CLICK2MAIL_DEFAULT_JOB_TEMPLATE_ID?.trim() || "",
    defaultSenderName: process.env.CLICK2MAIL_DEFAULT_SENDER_NAME?.trim() || "",
  };
}
