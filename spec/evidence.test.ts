import { randomBytes } from "node:crypto";
import { expect, inject, it } from "vitest";
import { NOTHING_LEFT, TestVisitor, buriedCells } from "./visitor";

// The tray is the player's evidence: a saved find keeps a private note, and
// a theory can cite a few finds from the poster's own tray, which everyone
// then sees alongside it.
const baseUrl = inject("baseUrl");

async function brushedFinds(player: TestVisitor, n: number): Promise<string[]> {
  const cells = buriedCells((await player.page()).doc).slice(0, n);
  expect(cells.length, NOTHING_LEFT).toBe(n);
  for (const cell of cells) {
    expect(await player.dig(cell)).toBe("ok");
    expect(await player.brush(cell)).toBe("brushed");
  }
  return cells;
}

it("a note on a saved find persists for its owner and stays private", async () => {
  const player = new TestVisitor(baseUrl);
  const [cell] = await brushedFinds(player, 1);
  expect(await player.collect(cell)).toBe("archived");

  const note = `looks like a pet ${randomBytes(4).toString("hex")}`;
  expect(await player.noteSpecimen(cell, note)).toBe("specimen-noted");
  const archive = (await player.page("/archive")).doc;
  expect(archive.querySelector(`#specimen-${cell} textarea`)?.textContent).toBe(note);

  const stranger = new TestVisitor(baseUrl);
  expect((await stranger.page("/archive")).html).not.toContain(note);
  expect((await stranger.page()).html).not.toContain(note);
  // and a note can't be put on a find that isn't in your own tray
  expect(await stranger.noteSpecimen(cell, "not mine")).toBe("archive-bad-cell");
});

it("a theory cites up to three finds from its author's tray, shown to everyone", async () => {
  const player = new TestVisitor(baseUrl);
  const cells = await brushedFinds(player, 2);
  for (const cell of cells) expect(await player.collect(cell)).toBe("archived");

  const marker = randomBytes(4).toString("hex");
  // the second dug-but-uncollected cell, and a nonsense key, are dropped
  const [outsider] = buriedCells((await player.page()).doc);
  expect(await player.theory(`a cat lover's homepage ${marker}`, [...cells, outsider, "99-99"])).toBe("theory-ok");

  const stranger = (await new TestVisitor(baseUrl).page()).doc;
  const item = [...stranger.querySelectorAll("#theories-list li")].find((li) => li.textContent?.includes(marker));
  expect(item, "theory missing from the shared feed").toBeDefined();
  const cited = [...(item?.querySelectorAll(".theory-evidence a") ?? [])].map((a) => a.getAttribute("href"));
  expect(cited.sort()).toEqual(cells.map((c) => `/section/${c}`).sort());
});

it("a theory can't cite more than three finds", async () => {
  const player = new TestVisitor(baseUrl);
  const cells = await brushedFinds(player, 4);
  for (const cell of cells) expect(await player.collect(cell)).toBe("archived");

  const marker = randomBytes(4).toString("hex");
  expect(await player.theory(`four finds ${marker}`, cells)).toBe("theory-ok");
  const doc = (await player.page()).doc;
  const item = [...doc.querySelectorAll("#theories-list li")].find((li) => li.textContent?.includes(marker));
  expect(item?.querySelectorAll(".theory-evidence a").length).toBe(3);
});
