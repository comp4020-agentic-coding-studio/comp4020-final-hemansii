import { alias } from "drizzle-orm/sqlite-core";
import { and, asc, count, eq, isNull } from "drizzle-orm";
import { COLS, ROWS, SITES, type Site } from "../sites";
import { db } from "./db";
import { changed } from "./events";
import { digs, sites, visitors } from "./schema";

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

export function openSite(): { id: string; site: Site } {
  const row = db.select().from(sites).where(isNull(sites.closedAt)).get();
  if (!row || !SITES[row.id]) throw new Error("no open site with known content");
  return { id: row.id, site: SITES[row.id] };
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
    if (digsToday(visitorId) >= DIGS_PER_DAY) return "out-of-digs";
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
  if (result === "ok") changed(siteId);
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
    return "brushed";
  });
  if (result === "brushed") changed(siteId);
  return result;
}
