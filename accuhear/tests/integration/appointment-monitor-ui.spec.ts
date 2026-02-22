import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTIVE_MONITOR_STATUSES,
  WAIT_WARNING_THRESHOLD_SECONDS,
  filterActiveMonitorAppointments,
  formatMonitorDuration,
  getMonitorStatusTone,
  getMonitorTimerPresentation,
} from "../../src/lib/appointments/monitor-ui";

test("wait timer warning flips at five minutes", () => {
  const now = new Date("2026-02-22T15:00:00.000Z");

  const underThreshold = getMonitorTimerPresentation(
    {
      status: { name: "Arrived" },
      arrivedAt: "2026-02-22T14:55:01.000Z",
      inProgressAt: null,
    },
    now
  );

  assert.equal(underThreshold.mode, "wait");
  assert.equal(underThreshold.elapsedSeconds, WAIT_WARNING_THRESHOLD_SECONDS - 1);
  assert.equal(underThreshold.warning, false);
  assert.equal(underThreshold.tone, "default");

  const threshold = getMonitorTimerPresentation(
    {
      status: { name: "Arrived" },
      arrivedAt: "2026-02-22T14:55:00.000Z",
      inProgressAt: null,
    },
    now
  );

  assert.equal(threshold.elapsedSeconds, WAIT_WARNING_THRESHOLD_SECONDS);
  assert.equal(threshold.warning, true);
  assert.equal(threshold.tone, "warning");
});

test("ready and in-progress statuses render expected tones and timer modes", () => {
  assert.equal(getMonitorStatusTone("Ready"), "ready");
  assert.equal(getMonitorStatusTone("In Progress"), "in-progress");

  const now = new Date("2026-02-22T15:10:00.000Z");
  const inProgressTimer = getMonitorTimerPresentation(
    {
      status: { name: "In Progress" },
      arrivedAt: "2026-02-22T15:00:00.000Z",
      inProgressAt: "2026-02-22T15:04:00.000Z",
    },
    now
  );

  assert.equal(inProgressTimer.mode, "in-progress");
  assert.equal(inProgressTimer.elapsedSeconds, 6 * 60);
  assert.equal(inProgressTimer.tone, "in-progress");
});

test("monitor UI filters down to active statuses only", () => {
  const appointments = [
    { id: "a1", status: { name: "Arrived" } },
    { id: "a2", status: { name: "Ready" } },
    { id: "a3", status: { name: "In Progress" } },
    { id: "a4", status: { name: "Completed" } },
    { id: "a5", status: { name: "Cancelled" } },
  ];

  const filtered = filterActiveMonitorAppointments(appointments);

  assert.deepEqual(
    filtered.map((appointment) => appointment.id),
    ["a1", "a2", "a3"]
  );

  assert.deepEqual([...ACTIVE_MONITOR_STATUSES], ["Arrived", "Arrived & Ready", "Ready", "In Progress"]);
});

test("duration formatting uses mm:ss and hh:mm:ss", () => {
  assert.equal(formatMonitorDuration(null), "--:--");
  assert.equal(formatMonitorDuration(62), "01:02");
  assert.equal(formatMonitorDuration(3670), "1:01:10");
});
