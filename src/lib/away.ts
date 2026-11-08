import { and, count, countDistinct, desc, eq, gt, isNotNull, max, ne } from "drizzle-orm";
import { siteFor } from "../sites";
import { db } from "./db";
import { digs, notes, sites, theories, visitors } from "./schema";

// A dig is played in short daily visits, so a returning player is told what
// the others did while they were away. Only other people's work counts (a
// player doesn't need telling about their own digs), and only gaps long
// enough to have missed something: a reload, or switching back from another
// tab, isn't "coming back". AWAY_MINUTES only exists so the spec can test
// a return without waiting an hour.
export const AWAY_MS = Number(process.env.AWAY_MINUTES ?? 60) * 60 * 1000;

export type AwaySummary = {
  since: string;
  // the site was named (or brushed clean) and replaced while they were gone
  solved: { title: string; by: string | null } | null;
  uncovered: number;
  brushed: number;
  theories: number;
  notes: number;
  diggers: number;
};

// What a visitor had seen when they last loaded the dig. Digs and site
// closures carry millisecond ISO times, so the time alone places them; notes
// and theories are stamped by SQLite only to the second, so the highest id
// of each seen is kept too, which is exact. Stored as one JSON column.
type Seen = { at: string; note: number; theory: number };

function parseSeen(raw: string | null): Seen | null {
  if (!raw) return null;
  try {
    const seen = JSON.parse(raw) as Seen;
    return typeof seen.at === "string" ? seen : null;
  } catch {
    return null;
  }
}

// Everything that happened on the open site since the visitor's last visit,
// by anyone else. Returns null when there's nothing worth a summary.
export function sinceLastVisit(visitorId: string, lastSeen: string | null, siteId: string, now = new Date()): AwaySummary | null {
  const seen = parseSeen(lastSeen);
  if (!seen || now.getTime() - new Date(seen.at).getTime() < AWAY_MS) return null;
  const since = seen.at;

  const closed = db
    .select({ id: sites.id, solvedBy: visitors.name })
    .from(sites)
    .leftJoin(visitors, eq(sites.solvedBy, visitors.id))
    .where(and(isNotNull(sites.closedAt), gt(sites.closedAt, since)))
    .orderBy(desc(sites.closedAt))
    .get();
  const solvedSite = closed && siteFor(closed.id);

  const dugByOthers = and(eq(digs.siteId, siteId), ne(digs.visitorId, visitorId), gt(digs.dugAt, since));
  const uncovered = db.select({ n: count() }).from(digs).where(dugByOthers).get()?.n ?? 0;
  const diggers = db.select({ n: countDistinct(digs.visitorId) }).from(digs).where(dugByOthers).get()?.n ?? 0;
  const brushed =
    db
      .select({ n: count() })
      .from(digs)
      .where(and(eq(digs.siteId, siteId), ne(digs.brushedBy, visitorId), gt(digs.brushedAt, since)))
      .get()?.n ?? 0;
  const theoryCount =
    db
      .select({ n: count() })
      .from(theories)
      .where(and(eq(theories.siteId, siteId), ne(theories.visitorId, visitorId), gt(theories.id, seen.theory)))
      .get()?.n ?? 0;
  const noteCount =
    db
      .select({ n: count() })
      .from(notes)
      .where(and(eq(notes.siteId, siteId), ne(notes.visitorId, visitorId), gt(notes.id, seen.note)))
      .get()?.n ?? 0;

  const solved = solvedSite ? { title: solvedSite.title, by: closed.solvedBy } : null;
  if (!solved && uncovered + brushed + theoryCount + noteCount === 0) return null;
  return { since, solved, uncovered, brushed, theories: theoryCount, notes: noteCount, diggers };
}

export function markSeen(visitorId: string, now = new Date()): void {
  const seen: Seen = {
    at: now.toISOString(),
    note: db.select({ n: max(notes.id) }).from(notes).get()?.n ?? 0,
    theory: db.select({ n: max(theories.id) }).from(theories).get()?.n ?? 0,
  };
  db.update(visitors).set({ lastSeenAt: JSON.stringify(seen) }).where(eq(visitors.id, visitorId)).run();
}
