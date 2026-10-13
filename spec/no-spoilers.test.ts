import { expect, inject, it } from "vitest";
import { cellAt, siteFor } from "../src/sites";
import { NOTHING_LEFT, TestVisitor, buriedCells, cellsInState } from "./visitor";

// The server never sends a section's content until it's been brushed:
// digging alone isn't enough, so neither a buried nor a merely-dusty section
// leaks its text, and only a brushed section's note page works.
const baseUrl = inject("baseUrl");

const plain = (html: string): string => html.replace(/<[^>]+>/g, "").trim();

// The open site's id is on the page, so this checks whichever site is open.
const siteOn = (doc: Document) => siteFor(doc.querySelector<HTMLElement>("[data-site]")?.dataset.site ?? "")!;

const distinctiveTextOf = (doc: Document, keys: string[]) =>
  keys
    .map((key) => {
      const [row, col] = key.split("-").map(Number);
      return { key, text: plain(cellAt(siteOn(doc), row, col)?.html ?? "") };
    })
    // Short fragments ("Home", "no frames!") could collide with page chrome.
    .filter(({ text }) => text.length >= 12);

it("buried sections' text is absent from the HTML and their notes 404", async () => {
  const visitor = new TestVisitor(baseUrl);
  const { html, doc } = await visitor.page();
  const buried = buriedCells(doc);

  for (const { key, text } of distinctiveTextOf(doc, buried)) {
    expect(html, `buried section ${key} leaked "${text}"`).not.toContain(text);
  }

  if (buried[0]) expect((await visitor.page(`/section/${buried[0]}`)).status).toBe(404);
});

it("a dug-but-not-brushed section still leaks nothing and still 404s", async () => {
  const visitor = new TestVisitor(baseUrl);
  const [cell] = buriedCells((await visitor.page()).doc);
  expect(cell, NOTHING_LEFT).toBeDefined();
  expect(await visitor.dig(cell)).toBe("ok");

  const { html, doc } = await visitor.page();
  expect(cellsInState(doc, "dusty")).toContain(cell);

  for (const { key, text } of distinctiveTextOf(doc, [cell])) {
    expect(html, `dusty section ${key} leaked "${text}"`).not.toContain(text);
  }
  expect((await visitor.page(`/section/${cell}`)).status).toBe(404);
});
