import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type AgreementLine = {
  label: string;
  serialNumber?: string | null;
  warrantyExpiration?: Date | string | null;
  amount?: number | null;
};

export type PurchaseAgreementPayload = {
  patientName: string;
  agreementDate: Date | string;
  providerNameAndTitle?: string | null;
  total: number | null;
  paymentsTotal: number | null;
  balanceDue: number | null;
  paymentMethod?: string | null;
  note?: string | null;
  lines: AgreementLine[];
};

const DYNAMIC_TEXT_FIELDS = [
  "modelNameLeft",
  "modelNameRight",
  "serialNumberLeft",
  "serialNumberRight",
  "aidSubtotalAsCurrencyLeft",
  "aidSubtotalAsCurrencyRight",
  "orderPaymentsAsCurrency",
  "orderBalanceDueAsCurrency",
  "patient eSignature",
  "Audiologist User Signature",
  "todaysDate",
  "patientNameCombined",
  "currentAidWarrantyExpirationDateLeft",
  "currentAidWarrantyExpirationDateRight",
  "{{providerNameAndTitle}}",
  "orderTotalAsCurrency",
  "Text8",
  "modelNameOrderableItemOther",
  "serialNumberOrderableItemOther",
  "modelNameOrderableItemOther2",
  "serialNumberOrderableItemOther2",
  "aidSubtotalAsCurrencyOrderableItemOther",
  "aidSubtotalAsCurrencyOrderableItemOther2",
] as const;

const BLANK_DROPDOWN_VALUE = " ";
const TEMPLATE_PATH_CANDIDATES = [
  process.env.PURCHASE_AGREEMENT_TEMPLATE_PATH,
  path.resolve(process.cwd(), "purchase agreement.pdf"),
  path.resolve(process.cwd(), "..", "purchase agreement.pdf"),
].filter((value): value is string => Boolean(value));

function formatCurrency(value?: number | null) {
  if (!Number.isFinite(value ?? NaN)) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value ?? 0);
}

function formatDate(value?: Date | string | null) {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function normalizePaymentMethod(value?: string | null) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return BLANK_DROPDOWN_VALUE;
  if (normalized === "cash") return "Cash";
  if (normalized === "visa") return "Visa";
  if (normalized === "mastercard" || normalized === "master card" || normalized === "mc") return "MC";
  if (normalized === "check") return "Check";
  if (normalized === "carecredit" || normalized === "care credit") return "CareCredit";
  if (normalized === "discover") return "Discover";
  if (normalized === "amex" || normalized === "american express") return "Amex";
  if (normalized.includes("insurance") || normalized.includes("ins") || normalized.includes("third party")) return "Ins";
  return BLANK_DROPDOWN_VALUE;
}

function normalizeBatteryDropdown(lines: AgreementLine[]) {
  const batteryLine = lines.find((line) => /battery/i.test(line.label));
  if (!batteryLine) return BLANK_DROPDOWN_VALUE;
  const label = batteryLine.label.toLowerCase();
  if (label.includes("312")) return " Box of #312 Batteries";
  if (label.includes("10")) return " Box of #10 Batteries";
  if (label.includes("13")) return " Box of #13 Batteries";
  return BLANK_DROPDOWN_VALUE;
}

function truncate(value: string, maxLength: number) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

async function resolveTemplatePath() {
  for (const candidate of TEMPLATE_PATH_CANDIDATES) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // keep trying fallbacks
    }
  }
  throw new Error("Purchase agreement template PDF was not found.");
}

function clearKnownFields(form: ReturnType<PDFDocument["getForm"]>) {
  for (const name of DYNAMIC_TEXT_FIELDS) {
    form.getTextField(name).setText("");
  }
  form.getDropdown("Dropdown4").select(BLANK_DROPDOWN_VALUE);
  form.getDropdown("Dropdown7").select(BLANK_DROPDOWN_VALUE);
}

function assignLineFields(form: ReturnType<PDFDocument["getForm"]>, line: AgreementLine | undefined, fields: {
  model: string;
  serial: string;
  warranty?: string;
  amount: string;
}) {
  form.getTextField(fields.model).setText(line ? truncate(line.label, 30) : "");
  form.getTextField(fields.serial).setText(line?.serialNumber?.trim() ?? "");
  if (fields.warranty) {
    form.getTextField(fields.warranty).setText(formatDate(line?.warrantyExpiration));
  }
  form.getTextField(fields.amount).setText(formatCurrency(line?.amount));
}

export async function generatePurchaseAgreementPdf(payload: PurchaseAgreementPayload) {
  const templatePath = await resolveTemplatePath();
  const templateBytes = await readFile(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  clearKnownFields(form);

  const [leftAid, rightAid, ...otherLines] = payload.lines;
  assignLineFields(form, leftAid, {
    model: "modelNameLeft",
    serial: "serialNumberLeft",
    warranty: "currentAidWarrantyExpirationDateLeft",
    amount: "aidSubtotalAsCurrencyLeft",
  });
  assignLineFields(form, rightAid, {
    model: "modelNameRight",
    serial: "serialNumberRight",
    warranty: "currentAidWarrantyExpirationDateRight",
    amount: "aidSubtotalAsCurrencyRight",
  });
  assignLineFields(form, otherLines[0], {
    model: "modelNameOrderableItemOther",
    serial: "serialNumberOrderableItemOther",
    amount: "aidSubtotalAsCurrencyOrderableItemOther",
  });
  assignLineFields(form, otherLines[1], {
    model: "modelNameOrderableItemOther2",
    serial: "serialNumberOrderableItemOther2",
    amount: "aidSubtotalAsCurrencyOrderableItemOther2",
  });

  form.getTextField("patientNameCombined").setText(payload.patientName);
  form.getTextField("todaysDate").setText(formatDate(payload.agreementDate));
  form.getTextField("orderTotalAsCurrency").setText(formatCurrency(payload.total));
  form.getTextField("orderPaymentsAsCurrency").setText(formatCurrency(payload.paymentsTotal));
  form.getTextField("orderBalanceDueAsCurrency").setText(formatCurrency(payload.balanceDue));
  form.getTextField("Text8").setText("");
  form.getTextField("{{providerNameAndTitle}}").setText(truncate(payload.providerNameAndTitle?.trim() ?? "", 28));
  form.getDropdown("Dropdown4").select(normalizeBatteryDropdown(payload.lines));
  form.getDropdown("Dropdown7").select(normalizePaymentMethod(payload.paymentMethod));

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.getPages()[0];
  form.updateFieldAppearances(font);
  if (page) {
    // Remove the baked-in sample patient signature while keeping the provider signature intact.
    page.drawRectangle({
      x: 142,
      y: 121,
      width: 114,
      height: 19,
      color: rgb(1, 1, 1),
    });

    // Replace the baked-in fee/note row with sale-specific text.
    page.drawRectangle({
      x: 48,
      y: 356,
      width: 265,
      height: 60,
      color: rgb(1, 1, 1),
    });
    if (payload.note?.trim()) {
      page.drawText(truncate(payload.note.trim(), 42), {
        x: 53,
        y: 370,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
  }

  for (const field of form.getFields()) {
    if (field.getName() !== "patient eSignature") {
      field.enableReadOnly();
    }
  }

  return Buffer.from(await pdfDoc.save());
}
