import { randomBytes } from "node:crypto";
import { expect, inject, it } from "vitest";
import { NOTHING_LEFT, TestVisitor, buriedCells } from "./visitor";

// A player picks a name once and it travels with everything they leave on
// the dig: their notes, their theories and their entries in the dig log, as
// seen by someone else entirely.
const baseUrl = inject("baseUrl");

it("a chosen name sticks and shows on that player's notes, theories and digs", async () => {
  const name = `Tester ${randomBytes(3).toString("hex")}`;
  const player = new TestVisitor(baseUrl);
  await player.page();
  expect(await player.rename(name)).toBe("name-set");
  expect((await player.page()).doc.querySelector(".status strong")?.textContent).toBe(name);

  const marker = randomBytes(4).toString("hex");
  await player.note(`try C7 next ${marker}`);
  await player.theory(`a fan site ${marker}`);
  const [cell] = buriedCells((await player.page()).doc);
  expect(cell, NOTHING_LEFT).toBeDefined();
  expect(await player.dig(cell)).toBe("ok");

  const stranger = (await new TestVisitor(baseUrl).page()).doc;
  const byText = (selector: string, text: string): Element | undefined =>
    [...stranger.querySelectorAll(selector)].find((el) => el.textContent?.includes(text));

  expect(byText("#notes-list li", marker)?.textContent).toContain(name);
  expect(byText("#theories-list li", marker)?.textContent).toContain(name);
  expect(stranger.querySelector("#mystery-latest")?.textContent).toContain(name);
  expect(byText("#dig-log-list li", name)?.textContent).toContain("uncovered");
});

it("a blank name is ignored rather than wiping the player's name", async () => {
  const player = new TestVisitor(baseUrl);
  const before = (await player.page()).doc.querySelector(".status strong")?.textContent;
  await player.rename("   ");
  expect((await player.page()).doc.querySelector(".status strong")?.textContent).toBe(before);
});
