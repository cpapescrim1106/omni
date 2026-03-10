import { NextResponse } from "next/server";
import {
  AppointmentActionHandlerError,
  getEntryPointActionSnapshot,
  parseEntryPointReferenceDate,
  parseTransitionTimestamp,
  resolveActionActorId,
  runEntryPointActionTransition,
} from "@/lib/appointments/status-action-handlers";
import { AppointmentTransitionError, isInClinicTransitionAction } from "@/lib/appointments/status-transition";

type MonitorActionBody = {
  action?: string;
  actorId?: string;
  at?: string;
  now?: string;
};

function toErrorResponse(error: unknown) {
  if (error instanceof AppointmentActionHandlerError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
  }

  if (error instanceof AppointmentTransitionError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
  }

  throw error;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const referenceDate = parseEntryPointReferenceDate(searchParams.get("today") ?? searchParams.get("now"));

  try {
    const payload = await getEntryPointActionSnapshot({
      appointmentId: id,
      entryPoint: "monitor-list",
      referenceDate,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as MonitorActionBody;

  if (!body.action || !isInClinicTransitionAction(body.action)) {
    return NextResponse.json({ error: "Invalid transition action." }, { status: 400 });
  }

  const referenceDate = parseEntryPointReferenceDate(body.now ?? null);
  const transitionAt = parseTransitionTimestamp(body.at);

  try {
    const payload = await runEntryPointActionTransition({
      appointmentId: id,
      entryPoint: "monitor-list",
      action: body.action,
      actorId: resolveActionActorId(request, body.actorId),
      at: transitionAt,
      referenceDate,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return toErrorResponse(error);
  }
}
