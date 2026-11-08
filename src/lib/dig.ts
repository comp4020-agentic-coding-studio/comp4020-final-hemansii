import { alias } from "drizzle-orm/sqlite-core";
import { and, asc, count, countDistinct, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { COLS, ORDER, ROWS, type Site, contentKey, siteFor } from "../sites";
import { db } from "./db";
import { changed } from "./events";
import { digPurchases, digs, sites, theories, theoryEvidence, visitors } from "./schema";

export const DIGS_PER_DAY = 5;

export type Finding = {
  finder: string;
  dugAt: string;
  brusher: string | null;
  brushedAt: string | null;
};
export type DigResult = "ok" | "out-of-digs" | "already-dug" | "out-of-range";
export type BrushResult = "brushed" | "already-brushed" | "nothing-there" | "out-of-range";

// The day the allowance resets on, in Canberra regardless of the server's TZ.
export const today = (now = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" }).format(now);

// The instant today() next changes, which is when free digs come back.
// Found from today() itself rather than from a second rule about midnight
// and daylight saving: today() is the one definition of a day. The next
// Canberra midnight is never more than 25 hours away, so search that span
// for where the date flips, down to the second it does.
export function nextReset(now = new Date()): Date {
  const day = today(now);
  let lo = now.getTime(); // still today
  let hi = lo + 25 * 60 * 60 * 1000; // past it
  while (hi - lo > 1000) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (today(new Date(mid)) === day) lo = mid;
    else hi = mid;
  }
  // the flip happens on a whole second
  return new Date(Math.floor(hi / 1000) * 1000);
}

export function openSite(): { id: string; site: Site; number: number } {
  const row = db.select().from(sites).where(isNull(sites.closedAt)).get();
  const site = row && siteFor(row.id);
  if (!row || !site) throw new Error("no open site with known content");
  return { id: row.id, site, number: db.select({ n: count() }).from(sites).get()?.n ?? 1 };
}

export type ClosedSite = { title: string; year: string; solvedBy: string | null; closedAt: string };

// Closes the open site and buries the next one in ORDER, wrapping round
// (with a fresh id, so the old dig's history stays put). Call inside the
// transaction that decided the site is done, so two requests can't both
// close it. `solvedBy` is null when the site was brushed clean unsolved.
export function rotate(tx: Pick<typeof db, "select" | "update" | "insert">, siteId: string, solvedBy: string | null): void {
  tx.update(sites)
    .set({ closedAt: new Date().toISOString(), solvedBy })
    .where(and(eq(sites.id, siteId), isNull(sites.closedAt)))
    .run();
  const key = ORDER[(ORDER.indexOf(contentKey(siteId)) + 1) % ORDER.length];
  const round = tx.select({ n: count() }).from(sites).where(eq(sites.id, key)).get()?.n ?? 0;
  let id = key;
  for (let n = 2; round > 0 && tx.select({ id: sites.id }).from(sites).where(eq(sites.id, id)).get(); n++) id = `${key}~${n}`;
  tx.insert(sites).values({ id }).run();
}

// The sites already dug and closed, newest first, with who named each one.
export function closedSites(limit = 10): ClosedSite[] {
  return db
    .select({ id: sites.id, closedAt: sites.closedAt, solvedBy: visitors.name })
    .from(sites)
    .leftJoin(visitors, eq(sites.solvedBy, visitors.id))
    .where(isNotNull(sites.closedAt))
    .orderBy(desc(sites.closedAt))
    .limit(limit)
    .all()
    .flatMap((r) => {
      const site = siteFor(r.id);
      return site ? [{ title: site.title, year: site.year, solvedBy: r.solvedBy, closedAt: r.closedAt ?? "" }] : [];
    });
}

export type PastSite = {
  id: string;
  title: string;
  year: string;
  solvedBy: string | null;
  openedAt: string;
  closedAt: string;
  diggers: number;
  theories: number;
  // everyone who dug or brushed a section of it, not only whoever named it
  contributors: number;
  // who uncovered or brushed the finds the solving theory cited
  cluesFrom: string[];
};

// Every closed site, newest first, with how many distinct visitors dug it
// and how many theories were posted about it. Unlike closedSites() above
// (a short teaser for the dig page), this is the full record for the
// history page, so it takes no default limit.
//
// A solve is a group effort: someone uncovered the clues, someone brushed
// them, and someone put a name to them. So each site also credits how many
// people dug or brushed it, and the people behind the clues the solving
// theory cited. All of it comes from rows already kept (digs, the theory's
// evidence); nothing new is stored.
export function digHistory(limit?: number): PastSite[] {
  const diggerCounts = db
    .select({ siteId: digs.siteId, n: countDistinct(digs.visitorId) })
    .from(digs)
    .groupBy(digs.siteId)
    .all();
  const diggersBySite = new Map(diggerCounts.map((r) => [r.siteId, r.n]));

  // diggers and brushers together, each person once per site
  const helpers = new Map<string, Set<string>>();
  for (const r of db.select({ siteId: digs.siteId, dug: digs.visitorId, brushed: digs.brushedBy }).from(digs).all()) {
    const set = helpers.get(r.siteId) ?? new Set<string>();
    set.add(r.dug);
    if (r.brushed) set.add(r.brushed);
    helpers.set(r.siteId, set);
  }

  const theoryCounts = db.select({ siteId: theories.siteId, n: count() }).from(theories).groupBy(theories.siteId).all();
  const theoriesBySite = new Map(theoryCounts.map((r) => [r.siteId, r.n]));

  let query = db
    .select({ id: sites.id, openedAt: sites.openedAt, closedAt: sites.closedAt, solvedBy: visitors.name, solverId: sites.solvedBy })
    .from(sites)
    .leftJoin(visitors, eq(sites.solvedBy, visitors.id))
    .where(isNotNull(sites.closedAt))
    .orderBy(desc(sites.closedAt))
    .$dynamic();
  if (limit !== undefined) query = query.limit(limit);

  return query
    .all()
    .flatMap((r) => {
      const site = siteFor(r.id);
      if (!site) return [];
      return [
        {
          id: r.id,
          title: site.title,
          year: site.year,
          solvedBy: r.solvedBy,
          openedAt: r.openedAt,
          closedAt: r.closedAt ?? "",
          diggers: diggersBySite.get(r.id) ?? 0,
          theories: theoriesBySite.get(r.id) ?? 0,
          contributors: helpers.get(r.id)?.size ?? 0,
          cluesFrom: r.solverId ? cluesBehindSolve(r.id, r.solverId) : [],
        },
      ];
    });
}

// The names behind the finds cited by the theory that solved a site: its
// solver's last theory there, the one that closed it. The solver themself is
// left out, being credited already. Each name once, in the order found.
function cluesBehindSolve(siteId: string, solverId: string): string[] {
  const winning = db
    .select({ id: theories.id })
    .from(theories)
    .where(and(eq(theories.siteId, siteId), eq(theories.visitorId, solverId)))
    .orderBy(desc(theories.id))
    .get();
  if (!winning) return [];
  const cited = db.select({ row: theoryEvidence.row, col: theoryEvidence.col }).from(theoryEvidence).where(eq(theoryEvidence.theoryId, winning.id)).all();
  if (cited.length === 0) return [];
  const brushers = alias(visitors, "brushers");
  const names: string[] = [];
  for (const { row, col } of cited) {
    const find = db
      .select({ finderId: digs.visitorId, finder: visitors.name, brusherId: digs.brushedBy, brusher: brushers.name })
      .from(digs)
      .innerJoin(visitors, eq(digs.visitorId, visitors.id))
      .leftJoin(brushers, eq(digs.brushedBy, brushers.id))
      .where(and(eq(digs.siteId, siteId), eq(digs.row, row), eq(digs.col, col)))
      .orderBy(asc(digs.id))
      .get();
    if (!find) continue;
    for (const [id, name] of [[find.finderId, find.finder], [find.brusherId, find.brusher]] as const) {
      if (id && name && id !== solverId && !names.includes(name)) names.push(name);
    }
  }
  return names;
}

export function digsToday(visitorId: string): number {
  return (
    db
      .select({ n: count() })
      .from(digs)
      .where(and(eq(digs.visitorId, visitorId), eq(digs.day, today())))
      .get()?.n ?? 0
  );
}

// How many bonus digs this visitor has bought today (src/lib/shop.ts), so
// today's effective cap is DIGS_PER_DAY plus whatever they've paid for.
export function digsPurchasedToday(visitorId: string): number {
  return (
    db
      .select({ n: count() })
      .from(digPurchases)
      .where(and(eq(digPurchases.visitorId, visitorId), eq(digPurchases.day, today())))
      .get()?.n ?? 0
  );
}

export function digAllowance(visitorId: string): number {
  return DIGS_PER_DAY + digsPurchasedToday(visitorId);
}

// Keyed "row-col". One entry per dug cell, whether or not it's been brushed
// yet, brushing is what reveals a cell's content, digging just uncovers it.
export function findings(siteId: string): Map<string, Finding> {
  const brushers = alias(visitors, "brushers");
  const rows = db
    .select({
      row: digs.row,
      col: digs.col,
      finder: visitors.name,
      dugAt: digs.dugAt,
      brusher: brushers.name,
      brushedAt: digs.brushedAt,
    })
    .from(digs)
    .innerJoin(visitors, eq(digs.visitorId, visitors.id))
    .leftJoin(brushers, eq(digs.brushedBy, brushers.id))
    .where(eq(digs.siteId, siteId))
    .orderBy(asc(digs.id))
    .all();
  const found = new Map<string, Finding>();
  for (const r of rows) {
    const key = `${r.row}-${r.col}`;
    if (!found.has(key)) {
      found.set(key, { finder: r.finder, dugAt: r.dugAt, brusher: r.brusher, brushedAt: r.brushedAt });
    }
  }
  return found;
}

// better-sqlite3 transactions are synchronous, so checks and insert can't
// interleave with another request's: the first dig on a section wins.
export function dig(visitorId: string, row: number, col: number): DigResult {
  if (!Number.isInteger(row) || !Number.isInteger(col)) return "out-of-range";
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return "out-of-range";

  let siteId = "";
  const result = db.transaction((tx) => {
    ({ id: siteId } = openSite());
    if (digsToday(visitorId) >= digAllowance(visitorId)) return "out-of-digs";
    const taken = tx
      .select({ id: digs.id })
      .from(digs)
      .where(and(eq(digs.siteId, siteId), eq(digs.row, row), eq(digs.col, col)))
      .get();
    if (taken) return "already-dug";
    tx.insert(digs)
      .values({ siteId, row, col, visitorId, dugAt: new Date().toISOString(), day: today() })
      .run();
    return "ok";
  });
  if (result === "ok") changed();
  return result;
}

// Anyone can brush a dusty cell clean, not just whoever dug it: that's the
// collaborative step. No daily cap: brushing is cheap, digging is the limit.
export function brush(visitorId: string, row: number, col: number): BrushResult {
  if (!Number.isInteger(row) || !Number.isInteger(col)) return "out-of-range";
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return "out-of-range";

  let siteId = "";
  const result = db.transaction((tx) => {
    ({ id: siteId } = openSite());
    const found = tx
      .select({ id: digs.id, brushedAt: digs.brushedAt })
      .from(digs)
      .where(and(eq(digs.siteId, siteId), eq(digs.row, row), eq(digs.col, col)))
      .get();
    if (!found) return "nothing-there";
    if (found.brushedAt) return "already-brushed";
    tx.update(digs)
      .set({ brushedAt: new Date().toISOString(), brushedBy: visitorId })
      .where(eq(digs.id, found.id))
      .run();
    // the last section brushed clean ends the dig even if nobody named it
    const clean = tx
      .select({ n: count() })
      .from(digs)
      .where(and(eq(digs.siteId, siteId), isNotNull(digs.brushedAt)))
      .get()?.n ?? 0;
    if (clean >= ROWS * COLS) rotate(tx, siteId, null);
    return "brushed";
  });
  if (result === "brushed") changed();
  return result;
}
