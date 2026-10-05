import { expect, inject, it } from "vitest";
import { NOTHING_LEFT, TestVisitor, buriedCells, stateOf } from "./visitor";

const baseUrl = inject("baseUrl");

it("each visitor gets 5 digs a day; the 6th is refused and digs nothing", async () => {
  const visitor = new TestVisitor(baseUrl);
  const cells = buriedCells((await visitor.page()).doc);
  expect(cells.length, NOTHING_LEFT).toBeGreaterThanOrEqual(6);

  for (const cell of cells.slice(0, 5)) expect(await visitor.dig(cell)).toBe("ok");
  expect(await visitor.dig(cells[5])).toBe("out-of-digs");

  expect(stateOf((await visitor.page()).doc, cells[5])).toBe("buried");
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
