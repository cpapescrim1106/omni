export type EmailSendPayload = {
  patientId: string;
  threadId: string;
  subject?: string;
  body: string;
};

export type EmailSendResult = { ok: boolean; provider: "stub" };

const emailSendLog: EmailSendPayload[] = [];

type EmailAdapter = (payload: EmailSendPayload) => Promise<EmailSendResult>;

let adapter: EmailAdapter = async (payload) => {
  emailSendLog.push(payload);
  return { ok: true, provider: "stub" };
};

export function setEmailAdapter(next: EmailAdapter) {
  adapter = next;
}

export async function sendEmail(payload: EmailSendPayload): Promise<EmailSendResult> {
  return adapter(payload);
}

export function getEmailSendLog() {
  return [...emailSendLog];
}

export function resetEmailSendLog() {
  emailSendLog.length = 0;
}
