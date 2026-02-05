export type SmsSendPayload = {
  patientId: string;
  threadId: string;
  body: string;
};

type SmsSendResult = { ok: boolean; provider: "ringcentral" };

const smsSendLog: SmsSendPayload[] = [];

export async function sendSms(payload: SmsSendPayload): Promise<SmsSendResult> {
  smsSendLog.push(payload);
  return { ok: true, provider: "ringcentral" };
}

export function getSmsSendLog() {
  return [...smsSendLog];
}

export function resetSmsSendLog() {
  smsSendLog.length = 0;
}
