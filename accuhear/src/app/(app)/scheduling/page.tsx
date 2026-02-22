"use client";

import { Suspense } from "react";
import { BigSchedule } from "@/components/scheduling/schedule-board";
import { InClinicMonitor } from "@/components/scheduling/in-clinic-monitor";

export default function SchedulingPage() {
  return (
    <Suspense fallback={<div className="card p-6">Loading...</div>}>
      <div className="space-y-4">
        <BigSchedule />
        <InClinicMonitor />
      </div>
    </Suspense>
  );
}
