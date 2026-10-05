import { expect, inject, it } from "vitest";
import { FIRST_SITE, SITES, cellAt } from "../src/sites";
import { TestVisitor, buriedCells } from "./visitor";

// The server never sends a buried section's content: digging is the only way
// to see it, in the page source as much as on screen.
const baseUrl = inject("baseUrl");
const site = SITES[FIRST_SITE];

const plain = (html: string): string => html.replace(/<[^>]+>/g, "").trim();

it("buried sections' text is absent from the HTML and their notes 404", async () => {
  const visitor = new TestVisitor(baseUrl);
  const { html, doc } = await visitor.page();
  const buried = buriedCells(doc);

  // Short fragments ("Home", "no frames!") could collide with page chrome.
  const distinctive = buried
    .map((key) => {
      const [row, col] = key.split("-").map(Number);
      return { key, text: plain(cellAt(site, row, col)?.html ?? "") };
    })
    .filter(({ text }) => text.length >= 12);

  for (const { key, text } of distinctive) {
    expect(html, `buried section ${key} leaked "${text}"`).not.toContain(text);
  }

  if (buried[0]) expect((await visitor.page(`/section/${buried[0]}`)).status).toBe(404);
});
