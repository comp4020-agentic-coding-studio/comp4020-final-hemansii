import { expect, inject, it } from "vitest";

// Design for co-presence (the final project brief): the app should be more
// interesting because other people are using it at the same time. The
// excavation shows a live count of open sessions ("N people digging right
// now"), pushed as its own `here` event over the existing /api/events
// stream (src/pages/api/events.ts, src/lib/events.ts). This checks the
// count itself, not just that a message arrived.
const baseUrl = inject("baseUrl");

const LIVE_BUDGET_MS = 1500;

// Other spec files hold their own /api/events connections open while this
// runs, so the live count is never guaranteed to start at 0: this asserts
// the *change* a connection causes, not an absolute number.
async function readHere(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<number> {
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) throw new Error("/api/events closed before sending a here event");
    buffer += decoder.decode(value);
    const match = buffer.match(/event: here\ndata: (\d+)/);
    if (match) return Number(match[1]);
  }
}

async function withinBudget<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} took longer than ${LIVE_BUDGET_MS}ms`)), LIVE_BUDGET_MS);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

it("a second open session raises the live count by one, and closing it drops it back", async () => {
  const first = await fetch(new URL("/api/events", baseUrl));
  const readerFirst = first.body!.getReader();
  try {
    const baseline = await withinBudget(readHere(readerFirst), "the first session's own here event");

    const second = await fetch(new URL("/api/events", baseUrl));
    const readerSecond = second.body!.getReader();
    try {
      // the second session's own join is reported to itself...
      const afterJoin = await withinBudget(readHere(readerSecond), "the second session's own here event");
      expect(afterJoin).toBe(baseline + 1);

      // ...and broadcast to the first session too, with no reload.
      const broadcastToFirst = await withinBudget(readHere(readerFirst), "the join reaching the first session");
      expect(broadcastToFirst).toBe(baseline + 1);
    } finally {
      await readerSecond.cancel().catch(() => {});
    }

    // the second session leaving is broadcast back down to the first.
    const afterLeave = await withinBudget(readHere(readerFirst), "the leave reaching the first session");
    expect(afterLeave).toBe(baseline);
  } finally {
    await readerFirst.cancel().catch(() => {});
  }
});
