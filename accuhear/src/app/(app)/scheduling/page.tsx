"use client";

import { Suspense } from "react";
import { BigSchedule } from "@/components/scheduling/schedule-board";

export default function SchedulingPage() {
  return (
    <Suspense fallback={<div className="card p-6">Loading...</div>}>
      <BigSchedule />
    </Suspense>
  );
}
