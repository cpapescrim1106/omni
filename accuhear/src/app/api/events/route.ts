import { eventBus } from "@/lib/event-bus";

export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();
  let closed = false;
  let interval: ReturnType<typeof setInterval> | null = null;
  let onEvent: ((payload: Record<string, unknown>) => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let controllerClosed = false;
      const cleanup = () => {
        if (interval) clearInterval(interval);
        if (onEvent) eventBus.off("event", onEvent);
      };
      const send = (data: string) => {
        if (closed || controllerClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          closed = true;
          controllerClosed = true;
          cleanup();
        }
      };

      send(JSON.stringify({ type: "connected", ts: Date.now() }));

      onEvent = (payload: Record<string, unknown>) => {
        send(JSON.stringify({ type: "update", payload, ts: Date.now() }));
      };

      eventBus.on("event", onEvent);

      interval = setInterval(() => {
        send(JSON.stringify({ type: "ping", ts: Date.now() }));
      }, 10000);
    },
    cancel() {
      closed = true;
      if (interval) clearInterval(interval);
      if (onEvent) eventBus.off("event", onEvent);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export function HEAD() {
  return new Response(null, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
