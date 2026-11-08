import { expect, inject, it } from "vitest";
import { SITES, siteFor } from "../src/sites";
import { NOTHING_LEFT, TestVisitor, buriedCells } from "./visitor";

// Naming the buried site in a theory solves it: the site closes, everyone
// sees who named it, and the next site is buried. But only with evidence:
// the theory has to cite a find from the poster's own tray, or knowing the
// five site names would be enough to skip the dig. Named zz- so it runs
// last, since every other spec file digs into whichever site is open.
const baseUrl = inject("baseUrl");

const openSiteOn = (doc: Document): string => doc.querySelector<HTMLElement>("[data-site]")?.dataset.site ?? "";

// Dig, brush and save one section, so `player` has a real find to cite.
async function findOne(player: TestVisitor): Promise<string> {
  const [cell] = buriedCells((await player.page()).doc);
  expect(cell, NOTHING_LEFT).toBeDefined();
  expect(await player.dig(cell)).toBe("ok");
  expect(await player.brush(cell)).toBe("brushed");
  expect(await player.collect(cell)).toBe("archived");
  return cell;
}

it("naming the site without evidence posts the theory but doesn't solve it", async () => {
  const player = new TestVisitor(baseUrl);
  const before = openSiteOn((await player.page()).doc);
  const site = siteFor(before);
  expect(site, "the page should carry the open site's id").toBeDefined();

  // every site's name at once: the shortcut this rule exists to close
  const everyName = Object.values(SITES).map((s) => s.title).join(", ");
  expect(await player.theory(everyName)).toBe("theory-ok");
  // the right name alone, but nothing cited
  expect(await player.theory(`It's ${site!.title}`)).toBe("theory-needs-evidence");
  // citing a section that isn't in this player's tray counts for nothing
  const [notMine] = buriedCells((await player.page()).doc);
  expect(await player.theory(`It's ${site!.title}`, [notMine])).toBe("theory-needs-evidence");

  const after = (await player.page()).doc;
  expect(openSiteOn(after)).toBe(before);
  // posted all the same, as ordinary theories in the feed
  expect(after.getElementById("theories-list")?.textContent).toContain(everyName);
});

it("every site's name with real evidence still doesn't solve it", async () => {
  const player = new TestVisitor(baseUrl);
  const before = openSiteOn((await player.page()).doc);
  const cell = await findOne(player);
  const everyName = Object.values(SITES).map((s) => s.title).join(" or ");
  expect(await player.theory(everyName, [cell])).toBe("theory-ok");
  expect(openSiteOn((await player.page()).doc)).toBe(before);
});

it("a wrong guess changes nothing; naming the site with evidence buries the next one for everyone", async () => {
  const player = new TestVisitor(baseUrl);
  const before = openSiteOn((await player.page()).doc);
  const site = siteFor(before);
  expect(site, "the page should carry the open site's id").toBeDefined();
  const cell = await findOne(player);

  expect(await player.theory("a geocities fan page about horses", [cell])).toBe("theory-ok");
  expect(openSiteOn((await player.page()).doc)).toBe(before);

  expect(await player.theory(`I reckon it's ${site!.title}!`, [cell])).toBe("solved");
  const stranger = (await new TestVisitor(baseUrl).page()).doc;
  expect(openSiteOn(stranger)).not.toBe(before);
  expect(stranger.querySelector("[data-last-solved]")?.textContent).toContain(site!.title);
  // and the new site starts untouched
  expect(stranger.querySelectorAll('[data-state="buried"]').length).toBe(60);
});
