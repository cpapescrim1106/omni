import assert from "node:assert/strict";
import test from "node:test";
import {
  formatTransitionHistoryMeta,
  formatTransitionHistoryStatus,
  sortAppointmentTransitionHistory,
  toLifecycleStatusLabel,
} from "../../src/lib/appointments/transition-history";

test("transition history rendering helpers include status flow, actor, and timestamp", () => {
  const row = {
    id: "evt-1",
    fromStatus: "Arrived",
    toStatus: "Ready",
    actorId: "front-desk-user",
    timestamp: "2026-02-22T14:05:00.000Z",
  };

  assert.equal(formatTransitionHistoryStatus(row), "Arrived → Ready");

  const meta = formatTransitionHistoryMeta(row);
  assert.match(meta, /front-desk-user/);
  assert.match(meta, /2026|2\/22\/2026|22\/2\/2026/);
});

test("history sorting is deterministic by timestamp then id", () => {
  const sorted = sortAppointmentTransitionHistory([
    {
      id: "evt-c",
      fromStatus: "Ready",
      toStatus: "In Progress",
      actorId: "provider-a",
      timestamp: "2026-02-22T09:05:00.000Z",
    },
    {
      id: "evt-a",
      fromStatus: "Scheduled",
      toStatus: "Arrived",
      actorId: "front-desk",
      timestamp: "2026-02-22T09:00:00.000Z",
    },
    {
      id: "evt-b",
      fromStatus: "Arrived",
      toStatus: "Ready",
      actorId: "assistant",
      timestamp: "2026-02-22T09:05:00.000Z",
    },
  ]);

  assert.deepEqual(
    sorted.map((event) => event.id),
    ["evt-a", "evt-b", "evt-c"]
  );
});

test("lifecycle label formatter normalizes mapped status names", () => {
  assert.equal(toLifecycleStatusLabel("ArrivedAndReady"), "Arrived & Ready");
  assert.equal(toLifecycleStatusLabel("InProgress"), "In Progress");
  assert.equal(toLifecycleStatusLabel("Cancelled"), "Cancelled");
});
