import { getClick2MailConfig } from "@/lib/click2mail/config";

type RequestOptions = {
  method?: "GET" | "POST";
  path: string;
  form?: URLSearchParams;
  headers?: HeadersInit;
  body?: BodyInit;
};

function getAuthHeader(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`;
}

export async function click2MailRequest({ method = "GET", path, form, headers, body }: RequestOptions) {
  const config = getClick2MailConfig();
  const response = await fetch(`${config.baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
    method,
    headers: {
      Authorization: getAuthHeader(config.username, config.password),
      Accept: "application/xml",
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...headers,
    },
    body: body ?? form,
    cache: "no-store",
  });

  const text = await response.text().catch(() => "");
  if (!response.ok) {
    throw new Error(`Click2Mail request failed (${response.status}): ${text}`.trim());
  }

  return text;
}

function getXmlValue(xml: string, tagName: string) {
  const match = xml.match(new RegExp(`<${tagName}>([^<]+)</${tagName}>`, "i"));
  return match ? match[1] : null;
}

export async function getClick2MailCreditBalance() {
  const xml = await click2MailRequest({ path: "/credit" });

  return {
    raw: xml,
    balance: getXmlValue(xml, "balance") ? Number(getXmlValue(xml, "balance")) : null,
    allowNegative: getXmlValue(xml, "allowNegative")?.toLowerCase() === "true" ? true : getXmlValue(xml, "allowNegative")?.toLowerCase() === "false" ? false : null,
  };
}

export async function uploadClick2MailDocument(input: {
  documentName: string;
  documentClass: string;
  fileName: string;
  contentType: string;
  fileData: Buffer;
}) {
  const formData = new FormData();
  formData.set("documentFormat", "PDF");
  formData.set("documentName", input.documentName);
  formData.set("documentClass", input.documentClass);
  formData.set("file", new Blob([new Uint8Array(input.fileData)], { type: input.contentType }), input.fileName);

  const xml = await click2MailRequest({
    method: "POST",
    path: "/documents",
    headers: {
      Accept: "application/xml",
    },
    body: formData,
  });

  const id = getXmlValue(xml, "id");
  if (!id) throw new Error(`Click2Mail document upload returned no id: ${xml}`);
  return { id, raw: xml };
}

export async function createClick2MailAddressList(input: {
  listName: string;
  firstName: string;
  lastName: string;
  organization?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
}) {
  const xmlBody = [
    "<addressList>",
    `<addressListName>${escapeXml(input.listName)}</addressListName>`,
    "<addressMappingId>1</addressMappingId>",
    "<addresses>",
    "<address>",
    `<Firstname>${escapeXml(input.firstName)}</Firstname>`,
    `<Lastname>${escapeXml(input.lastName)}</Lastname>`,
    `<Organization>${escapeXml(input.organization ?? "")}</Organization>`,
    `<Address1>${escapeXml(input.address1)}</Address1>`,
    `<Address2>${escapeXml(input.address2 ?? "")}</Address2>`,
    "<Address3></Address3>",
    `<City>${escapeXml(input.city)}</City>`,
    `<State>${escapeXml(input.state)}</State>`,
    `<Postalcode>${escapeXml(input.postalCode)}</Postalcode>`,
    "<Country></Country>",
    "</address>",
    "</addresses>",
    "</addressList>",
  ].join("");

  const xml = await click2MailRequest({
    method: "POST",
    path: "/addressLists",
    headers: {
      Accept: "application/xml",
      "Content-Type": "application/xml",
    },
    body: xmlBody,
  });

  const id = getXmlValue(xml, "id");
  if (!id) throw new Error(`Click2Mail address list creation returned no id: ${xml}`);
  return { id, raw: xml, status: getXmlValue(xml, "status") };
}

export async function createClick2MailJob(input: {
  documentId: string;
  addressId: string;
  documentClass: string;
  layout: string;
  productionTime: string;
  envelope: string;
  color: string;
  paperType: string;
  printOption: string;
}) {
  const form = new URLSearchParams();
  form.set("documentClass", input.documentClass);
  form.set("layout", input.layout);
  form.set("productionTime", input.productionTime);
  form.set("envelope", input.envelope);
  form.set("color", input.color);
  form.set("paperType", input.paperType);
  form.set("printOption", input.printOption);
  form.set("documentId", input.documentId);
  form.set("addressId", input.addressId);

  const xml = await click2MailRequest({
    method: "POST",
    path: "/jobs",
    form,
  });

  const id = getXmlValue(xml, "id");
  if (!id) throw new Error(`Click2Mail job creation returned no id: ${xml}`);
  return { id, raw: xml };
}

export async function submitClick2MailJob(jobId: string, billingType: string) {
  const form = new URLSearchParams();
  form.set("billingType", billingType);

  const xml = await click2MailRequest({
    method: "POST",
    path: `/jobs/${jobId}/submit`,
    form,
  });

  return {
    raw: xml,
    status: getXmlValue(xml, "status"),
    description: getXmlValue(xml, "description"),
  };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
