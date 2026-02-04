import { NextResponse } from "next/server";
import { searchPatients } from "@/lib/patient-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const status = searchParams.get("status");
  const results = await searchPatients(query, { status });
  return NextResponse.json({ results });
}
