import { expect, inject, it } from "vitest";
import { NOTHING_LEFT, TestVisitor, buriedCells, stateOf } from "./visitor";

// crit 8: "a stranger can visit, do the core thing, and find their trace
// still there when they come back." The core thing is digging a section,
// and since brushing is a separate, shared step, a stranger finishing what
// someone else started is part of what has to persist too.
const baseUrl = inject("baseUrl");

it("a dig stays dusty, and a stranger's brush reveals it for everyone", async () => {
  const digger = new TestVisitor(baseUrl);
  const first = await digger.page();
  const name = first.doc.querySelector(".status strong")?.textContent;
  const [cell] = buriedCells(first.doc);
  expect(cell, NOTHING_LEFT).toBeDefined();

  expect(await digger.dig(cell)).toBe("ok");

  const back = await digger.page();
  expect(stateOf(back.doc, cell)).toBe("dusty");

  const stranger = await new TestVisitor(baseUrl).page();
  expect(stateOf(stranger.doc, cell)).toBe("dusty");
  expect((await new TestVisitor(baseUrl).page(`/section/${cell}`)).status).toBe(404);

  const brusher = new TestVisitor(baseUrl);
  expect(await brusher.brush(cell)).toBe("brushed");

  const revealedForBrusher = await brusher.page();
  expect(stateOf(revealedForBrusher.doc, cell)).toBe("revealed");
  expect(revealedForBrusher.doc.querySelector(`[data-cell="${cell}"]`)?.textContent?.trim()).not.toBe("");

  const revealedForStranger = await new TestVisitor(baseUrl).page();
  expect(stateOf(revealedForStranger.doc, cell)).toBe("revealed");

  const note = await new TestVisitor(baseUrl).page(`/section/${cell}`);
  expect(note.status).toBe(200);
  expect(note.doc.querySelector("[data-finder]")?.textContent).toContain(name);
});
