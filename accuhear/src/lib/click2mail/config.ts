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
    documentClass: process.env.CLICK2MAIL_DOCUMENT_CLASS?.trim() || "Letter 8.5 x 11",
    layout: process.env.CLICK2MAIL_LAYOUT?.trim() || "Address on Separate Page",
    productionTime: process.env.CLICK2MAIL_PRODUCTION_TIME?.trim() || "Next Day",
    envelope: process.env.CLICK2MAIL_ENVELOPE?.trim() || "#10 Double Window",
    color: process.env.CLICK2MAIL_COLOR?.trim() || "Black and White",
    paperType: process.env.CLICK2MAIL_PAPER_TYPE?.trim() || "White 24#",
    printOption: process.env.CLICK2MAIL_PRINT_OPTION?.trim() || "Printing One side",
    billingType: process.env.CLICK2MAIL_BILLING_TYPE?.trim() || "User Credit",
  };
}
