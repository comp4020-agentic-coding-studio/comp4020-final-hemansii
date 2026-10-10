import type { APIRoute } from "astro";
import { openSite } from "../../lib/dig";
import { subscribe } from "../../lib/events";

// Server-sent events: one open stream per visitor, the only direction data
// ever needs to travel, since every visitor already mutates state over the
// existing POST routes. A message carries no payload, it just means "go
// re-fetch"; the ping keeps the connection (and, while anyone is watching,
// the Fly machine) alive across the ~20s it'd otherwise sit idle.
const PING_MS = 20_000;

export const GET: APIRoute = ({ request }) => {
  const { id: siteId } = openSite();
  const encoder = new TextEncoder();

  let unsubscribe = (): void => {};
  let ping: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      const send = (line: string): void => controller.enqueue(encoder.encode(line));
      unsubscribe = subscribe(siteId, () => send("data: changed\n\n"));
      ping = setInterval(() => send(": ping\n\n"), PING_MS);
      send("retry: 2000\n\n");
    },
    cancel() {
      clearInterval(ping);
      unsubscribe();
    },
  });

  request.signal.addEventListener("abort", () => {
    clearInterval(ping);
    unsubscribe();
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
};
