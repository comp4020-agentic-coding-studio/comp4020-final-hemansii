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
