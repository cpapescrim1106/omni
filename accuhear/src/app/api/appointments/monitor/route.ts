import { NextResponse } from "next/server";
import { fetchMonitorAppointments } from "@/lib/appointments/monitor-feed";

function parseNow(nowParam: string | null) {
  if (!nowParam) return undefined;
  const parsed = new Date(nowParam);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const appointments = await fetchMonitorAppointments({
    start: searchParams.get("start"),
    end: searchParams.get("end"),
    date: searchParams.get("date"),
    provider: searchParams.get("provider"),
    now: parseNow(searchParams.get("now")),
  });

  return NextResponse.json({
    appointments,
    generatedAt: new Date().toISOString(),
  });
}
