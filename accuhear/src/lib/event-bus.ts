import { EventEmitter } from "node:events";

const globalForEvents = globalThis as { eventBus?: EventEmitter };

export const eventBus = globalForEvents.eventBus ?? new EventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalForEvents.eventBus = eventBus;
}

export function emitEvent(payload: Record<string, unknown>) {
  eventBus.emit("event", payload);
}
