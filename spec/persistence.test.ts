import { expect, inject, it } from "vitest";
import { NOTHING_LEFT, TestVisitor, buriedCells, stateOf } from "./visitor";

// crit 8: "a stranger can visit, do the core thing, and find their trace
// still there when they come back." The core thing is digging a section.
const baseUrl = inject("baseUrl");

it("a dig stays uncovered for the digger coming back and for a stranger", async () => {
  const digger = new TestVisitor(baseUrl);
  const first = await digger.page();
  const name = first.doc.querySelector(".status strong")?.textContent;
  const [cell] = buriedCells(first.doc);
  expect(cell, NOTHING_LEFT).toBeDefined();

  expect(await digger.dig(cell)).toBe("ok");

  const back = await digger.page();
  expect(stateOf(back.doc, cell)).toBe("revealed");

  const stranger = await new TestVisitor(baseUrl).page();
  expect(stateOf(stranger.doc, cell)).toBe("revealed");
  expect(stranger.doc.querySelector(`[data-cell="${cell}"]`)?.textContent?.trim()).not.toBe("");

  const note = await new TestVisitor(baseUrl).page(`/section/${cell}`);
  expect(note.status).toBe(200);
  expect(note.doc.querySelector("[data-finder]")?.textContent).toContain(name);
});
