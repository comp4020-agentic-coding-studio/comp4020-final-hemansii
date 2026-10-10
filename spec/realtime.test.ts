import { expect, inject, it } from "vitest";
import { NOTHING_LEFT, TestVisitor, buriedCells, stateOf } from "./visitor";

// crit 9: "all at once". A change one visitor makes has to reach every other
// open session within about a second, with no reload. `/api/events` is the
// push channel (src/pages/api/events.ts); this opens it the way a browser's
// EventSource would and waits for a message, rather than polling `/`.
const baseUrl = inject("baseUrl");

// `about a second` with CI slack: generous enough that a loaded runner
// doesn't flake, tight enough that a polling-only implementation (several
// seconds between checks) would still fail it.
const LIVE_BUDGET_MS = 1500;

// Takes the reader rather than the stream so a caller that gives up on the
// budget can still cancel it; otherwise a message that never arrives leaves
// an open connection reading forever past the end of the test.
async function waitForMessage(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) throw new Error("/api/events closed before sending anything");
    if (decoder.decode(value).includes("data:")) return;
  }
}

async function withinBudget(promise: Promise<void>, label: string): Promise<void> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} took longer than ${LIVE_BUDGET_MS}ms`)), LIVE_BUDGET_MS);
  });
  try {
    await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

it("a dig reaches an already-open session within about a second, no reload", async () => {
  const digger = new TestVisitor(baseUrl);
  const [cell] = buriedCells((await digger.page()).doc);
  expect(cell, NOTHING_LEFT).toBeDefined();

  const res = await fetch(new URL("/api/events", baseUrl));
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toContain("text/event-stream");
  expect(res.body).not.toBeNull();

  const reader = res.body!.getReader();
  try {
    const arrived = waitForMessage(reader);
    await digger.dig(cell);
    await withinBudget(arrived, "the dig event");
  } finally {
    await reader.cancel().catch(() => {});
  }

  // No reload: the event is a cue, the truth is still read with a plain GET.
  expect(stateOf((await digger.page()).doc, cell)).toBe("dusty");
});

it("every open session hears about a change, not just one", async () => {
  const digger = new TestVisitor(baseUrl);
  const [cell] = buriedCells((await digger.page()).doc);
  expect(cell, NOTHING_LEFT).toBeDefined();

  const [a, b] = await Promise.all([
    fetch(new URL("/api/events", baseUrl)),
    fetch(new URL("/api/events", baseUrl)),
  ]);
  const readerA = a.body!.getReader();
  const readerB = b.body!.getReader();
  try {
    await digger.dig(cell);
    await withinBudget(
      Promise.all([waitForMessage(readerA), waitForMessage(readerB)]).then(() => {}),
      "both sessions hearing the dig",
    );
  } finally {
    await Promise.all([readerA.cancel().catch(() => {}), readerB.cancel().catch(() => {})]);
  }
});
