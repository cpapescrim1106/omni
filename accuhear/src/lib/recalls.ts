import { prisma } from "@/lib/db";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function generateRecallsForPatient(patientId: string, now = new Date()) {
  const rules = await prisma.recallRule.findMany({ where: { active: true } });
  const generated = [] as Array<{ id: string }>;

  for (const rule of rules) {
    let dueDate: Date | null = null;

    if (rule.triggerType === "days_after_visit") {
      const appointment = await prisma.appointment.findFirst({
        where: {
          patientId,
          ...(rule.appointmentType
            ? {
                type: {
                  name: rule.appointmentType,
                },
              }
            : {}),
        },
        orderBy: { endTime: "desc" },
      });

      if (!appointment) continue;
      const base = appointment.endTime ?? appointment.startTime;
      dueDate = addDays(base, rule.triggerDays ?? 0);
    } else if (rule.triggerType === "days_after_purchase") {
      const sale = await prisma.saleTransaction.findFirst({
        where: { patientId },
        orderBy: { date: "desc" },
      });

      if (!sale) continue;
      dueDate = addDays(sale.date, rule.triggerDays ?? 0);
    } else if (rule.triggerType === "annual") {
      dueDate = addDays(now, 365);
    }

    if (!dueDate) continue;

    const existing = await prisma.recall.findFirst({
      where: {
        patientId,
        recallRuleId: rule.id,
        dueDate,
      },
    });

    if (existing) continue;

    const recall = await prisma.recall.create({
      data: {
        patientId,
        recallRuleId: rule.id,
        dueDate,
        status: "pending",
      },
    });

    generated.push({ id: recall.id });
  }

  return generated;
}

export async function runRecallGenerationJob(limit = 100) {
  const patients = await prisma.patient.findMany({ select: { id: true }, take: limit });
  const results: string[] = [];

  for (const patient of patients) {
    const generated = await generateRecallsForPatient(patient.id);
    results.push(...generated.map((item) => item.id));
  }

  return results;
}
