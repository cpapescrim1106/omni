import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { PDFDocument, type PDFFont, type PDFPage, StandardFonts, rgb } from "pdf-lib";

const execFileAsync = promisify(execFile);

type QuoteParty = {
  name: string;
  line2?: string | null;
  line3?: string | null;
};

type QuoteLine = {
  description: string;
  quantity: number;
  serialNumber?: string | null;
  warrantyExpiration?: Date | string | null;
  amount: number;
};

export type QuotePayload = {
  quoteDate: Date | string;
  billTo: QuoteParty;
  shipTo: QuoteParty;
  lines: QuoteLine[];
  subtotal: number;
  total: number;
  notes?: string | null;
};

const TEMPLATE_PATH_CANDIDATES = [
  process.env.QUOTE_TEMPLATE_PATH,
  path.resolve(process.cwd(), "quote.pdf"),
  path.resolve(process.cwd(), "..", "quote.pdf"),
].filter((value): value is string => Boolean(value));

function formatCurrency(value: number) {
  const normalized = Math.abs(value);
  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(normalized);
  return value < 0 ? `(${formatted})` : formatted;
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

function truncate(value: string, maxLength: number) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function topToBottom(pageHeight: number, topY: number, boxHeight = 0) {
  return pageHeight - topY - boxHeight;
}

function drawText(page: PDFPage, value: string, x: number, topY: number, size: number, font: PDFFont) {
  page.drawText(value, {
    x,
    y: topToBottom(page.getHeight(), topY, size),
    size,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
}

function drawRightAlignedText(page: PDFPage, value: string, rightX: number, topY: number, size: number, font: PDFFont) {
  const width = font.widthOfTextAtSize(value, size);
  drawText(page, value, rightX - width, topY, size, font);
}

function fillRectTop(page: PDFPage, leftX: number, topY: number, width: number, height: number) {
  page.drawRectangle({
    x: leftX,
    y: topToBottom(page.getHeight(), topY, height),
    width,
    height,
    color: rgb(1, 1, 1),
  });
}

async function resolveTemplatePath() {
  for (const candidate of TEMPLATE_PATH_CANDIDATES) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // continue
    }
  }
  throw new Error("Quote template PDF was not found.");
}

async function renderTemplatePngs(templatePath: string) {
  const dir = await mkdtemp(path.join(tmpdir(), "quote-template-"));
  try {
    const page1Base = path.join(dir, "page1");
    await execFileAsync("pdftoppm", ["-r", "72", "-png", "-f", "1", "-singlefile", templatePath, page1Base]);
    const page1Png = await readFile(`${page1Base}.png`);
    return { dir, page1Png };
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}

function drawQuotePageOne(page: PDFPage, payload: QuotePayload, font: PDFFont, bold: PDFFont) {
  // Clear only the variable text regions; preserve the template's existing borders and headers.
  fillRectTop(page, 503, 189, 48, 16);
  fillRectTop(page, 66, 281, 214, 54);
  fillRectTop(page, 318, 281, 206, 54);
  fillRectTop(page, 64, 388, 159, 258);
  fillRectTop(page, 235, 388, 52, 258);
  fillRectTop(page, 293, 388, 170, 258);
  fillRectTop(page, 460, 388, 86, 320);
  fillRectTop(page, 344, 664, 136, 46);

  drawText(page, formatDate(payload.quoteDate), 506, 191, 12, font);

  const billToLines = [payload.billTo.name, payload.billTo.line2 ?? ""].filter(Boolean);
  const shipToLines = [payload.shipTo.name, payload.shipTo.line2 ?? ""].filter(Boolean);
  billToLines.forEach((line, index) => drawText(page, truncate(line, 28), 72, 284 + index * 18, 12, font));
  shipToLines.forEach((line, index) => drawText(page, truncate(line, 28), 324, 284 + index * 18, 12, font));

  const rowTopStarts = [399, 441, 483, 525, 567, 609];
  payload.lines.slice(0, rowTopStarts.length).forEach((line, index) => {
    const top = rowTopStarts[index]!;
    drawText(page, truncate(line.description, 24), 68, top, 12, font);
    drawText(page, String(Math.max(1, line.quantity)), 267, top, 12, font);
    if (line.serialNumber) {
      drawText(page, truncate(`Serial # ${line.serialNumber}`, 24), 295, top, 12, font);
    }
    if (line.warrantyExpiration) {
      drawText(page, `Warranty expiry: ${formatDate(line.warrantyExpiration)}`, 295, top + 19, 11, font);
    }
    drawRightAlignedText(page, formatCurrency(line.amount), 529, top, 12, font);
  });

  drawRightAlignedText(page, formatCurrency(payload.subtotal), 529, 669, 12, font);
  drawRightAlignedText(page, formatCurrency(payload.total), 529, 691, 12, bold);
}

export async function generateQuotePdf(payload: QuotePayload) {
  const templatePath = await resolveTemplatePath();
  const { dir, page1Png } = await renderTemplatePngs(templatePath);

  try {
    const pdfDoc = await PDFDocument.create();
    const page1Image = await pdfDoc.embedPng(page1Png);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page1 = pdfDoc.addPage([612, 792]);
    page1.drawImage(page1Image, { x: 0, y: 0, width: 612, height: 792 });
    drawQuotePageOne(page1, payload, font, bold);

    return Buffer.from(await pdfDoc.save());
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
