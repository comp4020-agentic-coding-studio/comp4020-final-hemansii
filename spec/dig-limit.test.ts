import { expect, inject, it } from "vitest";
import { NOTHING_LEFT, TestVisitor, buriedCells, stateOf } from "./visitor";

const baseUrl = inject("baseUrl");

it("each visitor gets 5 digs a day; the 6th is refused and digs nothing", async () => {
  const visitor = new TestVisitor(baseUrl);
  const cells = buriedCells((await visitor.page()).doc);
  expect(cells.length, NOTHING_LEFT).toBeGreaterThanOrEqual(6);

  for (const cell of cells.slice(0, 5)) expect(await visitor.dig(cell)).toBe("ok");
  expect(await visitor.dig(cells[5])).toBe("out-of-digs");

  const after = (await visitor.page()).doc;
  expect(stateOf(after, cells[5])).toBe("buried");

  // Out of digs, the ground is still tappable: a disabled button swallows
  // the tap silently, and the player gets no word on why nothing happened.
  // It's marked spent instead, and the server's refusal above still holds.
  const tile = after.querySelector<HTMLButtonElement>(`[data-cell="${cells[5]}"]`);
  expect(tile?.disabled).toBe(false);
  expect(tile?.hasAttribute("data-spent")).toBe(true);

  // And it says when they come back: the next Canberra midnight, the same
  // boundary the cap is counted on, as an instant and as a countdown.
  const status = after.querySelector<HTMLElement>("[data-reset-at]");
  const resetAt = Date.parse(status?.dataset.resetAt ?? "");
  expect(resetAt).toBeGreaterThan(Date.now());
  expect(resetAt - Date.now()).toBeLessThanOrEqual(25 * 60 * 60 * 1000);
  const canberra = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  expect(canberra.format(resetAt)).toBe("00:00");
  expect(status?.querySelector("[data-reset-in]")?.textContent).toMatch(/^(\d+h )?\d+m$/);
  expect(after.getElementById("out-of-digs")?.textContent).toMatch(/Your free digs reset in (\d+h )?\d+m/);
});

// Not one after the other, but all at once: the top band of the brief is
// two people acting in the same instant. The check and the write share one
// transaction (src/lib/dig.ts), so however the requests interleave exactly
// one wins; split them apart and every racer wins (scripts/stress.ts shows
// it, 30 rows for one cell).
it("ten visitors digging the same section at once: exactly one wins", async () => {
  const racers = Array.from({ length: 10 }, () => new TestVisitor(baseUrl));
  await Promise.all(racers.map((r) => r.page()));
  const [cell] = buriedCells((await racers[0].page()).doc);
  expect(cell, NOTHING_LEFT).toBeDefined();

  const results = await Promise.all(racers.map((r) => r.dig(cell)));
  expect(results.filter((r) => r === "ok")).toHaveLength(1);
  expect(results.filter((r) => r === "already-dug")).toHaveLength(9);
  expect(stateOf((await new TestVisitor(baseUrl).page()).doc, cell)).toBe("dusty");
});

it("a section someone already uncovered can't be dug again", async () => {
  const first = new TestVisitor(baseUrl);
  const [cell] = buriedCells((await first.page()).doc);
  expect(cell, NOTHING_LEFT).toBeDefined();
  expect(await first.dig(cell)).toBe("ok");

  const second = new TestVisitor(baseUrl);
  await second.page();
  expect(await second.dig(cell)).toBe("already-dug");
});
