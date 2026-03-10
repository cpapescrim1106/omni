import { prisma } from "@/lib/db";
import {
  sortAppointmentTransitionHistory,
  toLifecycleStatusLabel,
  type AppointmentTransitionHistoryItem,
} from "@/lib/appointments/transition-history";

export async function fetchAppointmentTransitionHistory(appointmentId: string) {
  const events = await prisma.appointmentStatusEvent.findMany({
    where: { appointmentId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  const history = events.map((event) => {
    return {
      id: event.id,
      fromStatus: toLifecycleStatusLabel(event.fromStatus),
      toStatus: toLifecycleStatusLabel(event.toStatus) ?? "Unknown",
      actorId: event.actorId,
      timestamp: event.createdAt.toISOString(),
    } satisfies AppointmentTransitionHistoryItem;
  });

  return sortAppointmentTransitionHistory(history);
}
