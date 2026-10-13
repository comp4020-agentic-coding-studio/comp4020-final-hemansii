import { expect, inject, it } from "vitest";
import { siteFor } from "../src/sites";
import { TestVisitor } from "./visitor";

// Naming the buried site in a theory solves it: the site closes, everyone
// sees who named it, and the next site is buried. Named zz- so it runs last,
// since every other spec file digs into whichever site is open.
const baseUrl = inject("baseUrl");

const openSiteOn = (doc: Document): string => doc.querySelector<HTMLElement>("[data-site]")?.dataset.site ?? "";

it("a wrong guess changes nothing; naming the site buries the next one for everyone", async () => {
  const player = new TestVisitor(baseUrl);
  const before = openSiteOn((await player.page()).doc);
  const site = siteFor(before);
  expect(site, "the page should carry the open site's id").toBeDefined();

  expect(await player.theory("a geocities fan page about horses")).toBe("theory-ok");
  expect(openSiteOn((await player.page()).doc)).toBe(before);

  expect(await player.theory(`I reckon it's ${site!.title}!`)).toBe("solved");
  const stranger = (await new TestVisitor(baseUrl).page()).doc;
  expect(openSiteOn(stranger)).not.toBe(before);
  expect(stranger.querySelector("[data-last-solved]")?.textContent).toContain(site!.title);
  // and the new site starts untouched
  expect(stranger.querySelectorAll('[data-state="buried"]').length).toBe(60);
});
