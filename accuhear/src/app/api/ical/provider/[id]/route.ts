import { NextRequest } from "next/server";

export const runtime = "nodejs";

function buildIcs({ providerId }: { providerId: string }) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0);

  const fmt = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AccuHear//CRM//EN",
    `X-WR-CALNAME:AccuHear ${providerId}`,
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${providerId}-${start.getTime()}@accuhear`,
    `DTSTAMP:${fmt(now)}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    "SUMMARY:Consult - Drouin, Celine",
    "LOCATION:Spring Hill",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ics = buildIcs({ providerId: id });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
