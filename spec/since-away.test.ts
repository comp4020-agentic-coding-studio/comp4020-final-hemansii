import { expect, inject, it } from "vitest";
import { NOTHING_LEFT, TestVisitor, buriedCells } from "./visitor";

// A dig is played in short daily visits, so a returning player is told what
// the others did while they were away (src/lib/away.ts). Two rules hold
// whatever the threshold for "away" is: a player is never told about their
// own work, and a quick reload says nothing. The summary's content is
// checked when the app is started with AWAY_MINUTES=0, so a return can be
// tested without waiting an hour; CI runs the default hour and checks only
// the quiet side.
const baseUrl = inject("baseUrl");
const awayIsInstant = process.env.AWAY_MINUTES === "0";

it("a player is never told about their own digs on return", async () => {
  const me = new TestVisitor(baseUrl);
  const [cell] = buriedCells((await me.page()).doc);
  expect(cell, NOTHING_LEFT).toBeDefined();
  // a second page load, so this visitor has a last-seen time to come back to
  await me.page();
  expect(await me.dig(cell)).toBe("ok");
  const { doc } = await me.page();
  const summary = doc.getElementById("since-away")?.textContent ?? "";
  expect(summary).not.toMatch(/uncovered/);
});

it.runIf(awayIsInstant)("a returning player sees what others dug and noted while they were away", async () => {
  const me = new TestVisitor(baseUrl);
  await me.page();
  await me.page(); // now has a last-seen time

  const other = new TestVisitor(baseUrl);
  const [cell] = buriedCells((await other.page()).doc);
  expect(cell, NOTHING_LEFT).toBeDefined();
  expect(await other.dig(cell)).toBe("ok");
  expect(await other.note("try the top-left corner")).toBe("note-ok");

  const { doc } = await me.page();
  const summary = doc.getElementById("since-away");
  expect(summary, "a return after others acted should show the summary").not.toBeNull();
  expect(summary?.textContent).toMatch(/1 section uncovered/);
  expect(summary?.textContent).toMatch(/1 field note/);

  // seen once: the next load has nothing new to report
  expect((await me.page()).doc.getElementById("since-away")).toBeNull();
});

it.runIf(!awayIsInstant)("a quick reload doesn't count as coming back", async () => {
  const me = new TestVisitor(baseUrl);
  await me.page();
  const other = new TestVisitor(baseUrl);
  await other.page();
  await other.note("anyone else seeing blue?");
  expect((await me.page()).doc.getElementById("since-away")).toBeNull();
});
