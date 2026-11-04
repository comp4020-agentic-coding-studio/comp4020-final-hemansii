import type { APIRoute } from "astro";
import { presenceJoin, presenceLeave, subscribe, subscribePresence } from "../../lib/events";

// Server-sent events: one open stream per visitor, the only direction data
// ever needs to travel, since every visitor already mutates state over the
// existing POST routes. A "changed" message carries no payload, it just
// means "go re-fetch"; a "here" message carries the live count directly,
// since that number *is* the payload and there's nothing to re-fetch it
// from. The ping keeps the connection (and, while anyone is watching, the
// Fly machine) alive across the ~20s it'd otherwise sit idle.
const PING_MS = 20_000;

export const GET: APIRoute = ({ request }) => {
  const encoder = new TextEncoder();

  let unsubscribeChanged = (): void => {};
  let unsubscribePresence = (): void => {};
  let ping: ReturnType<typeof setInterval>;
  // The stream's own cancel() and the request's abort event both fire on a
  // dropped connection, not just one or the other depending on how it
  // dropped; without this guard that double-counts the leave.
  let left = false;

  const leave = (): void => {
    clearInterval(ping);
    unsubscribeChanged();
    unsubscribePresence();
    if (!left) presenceLeave();
    left = true;
  };

  const stream = new ReadableStream({
    start(controller) {
      const send = (line: string): void => controller.enqueue(encoder.encode(line));
      unsubscribeChanged = subscribe(() => send("data: changed\n\n"));
      unsubscribePresence = subscribePresence((count) => send(`event: here\ndata: ${count}\n\n`));
      ping = setInterval(() => send(": ping\n\n"), PING_MS);
      send("retry: 2000\n\n");
      presenceJoin();
    },
    cancel: leave,
  });

  request.signal.addEventListener("abort", leave);

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
};
