"use client";

import { Suspense } from "react";
import { BigSchedule } from "@/components/scheduling/big-schedule";

export default function SchedulingPage() {
  return (
    <Suspense fallback={<div className="card p-6">Loading...</div>}>
      <BigSchedule />
    </Suspense>
  );
}
