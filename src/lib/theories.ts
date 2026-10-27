import { and, desc, eq, inArray } from "drizzle-orm";
import { type Cell, cellAt, names, siteFor } from "../sites";
import { db } from "./db";
import { rotate } from "./dig";
import { changed } from "./events";
import { sites, specimens, theories, theoryEvidence, visitors } from "./schema";
import { awardSolve } from "./shop";

export type Evidence = { row: number; col: number; cell: Cell };
export type TheoryEntry = { id: number; author: string; authorId: string; body: string; postedAt: string; evidence: Evidence[] };

const MAX_LEN = 300;
// A theory leans on a few finds, not the whole tray.
export const MAX_EVIDENCE = 3;

export type TheoryResult = "rejected" | "posted" | "solved";

// `evidence` is "row-col" keys; only finds actually in the poster's own tray
// are kept, so a theory can't cite a section nobody has brushed yet (that
// would leak its content to everyone reading the feed). A theory that names
// the site solves it: the site closes and the next one is buried.
export function postTheory(visitorId: string, siteId: string, body: string, evidence: string[] = []): TheoryResult {
  const trimmed = body.trim().slice(0, MAX_LEN);
  if (!trimmed) return "rejected";
  const site = siteFor(siteId);
  const inTray = new Set(
    db
      .select({ row: specimens.row, col: specimens.col })
      .from(specimens)
      .where(and(eq(specimens.visitorId, visitorId), eq(specimens.siteId, siteId)))
      .all()
      .map(({ row, col }) => `${row}-${col}`),
  );
  const cited = [...new Set(evidence)].filter((key) => inTray.has(key)).slice(0, MAX_EVIDENCE);

  const solved = db.transaction((tx) => {
    const { id } = tx.insert(theories).values({ siteId, visitorId, body: trimmed }).returning({ id: theories.id }).get();
    for (const key of cited) {
      const [row, col] = key.split("-").map(Number);
      tx.insert(theoryEvidence).values({ theoryId: id, row, col }).onConflictDoNothing().run();
    }
    // still open? (a second correct guess in the same instant loses)
    const open = tx.select({ closedAt: sites.closedAt }).from(sites).where(eq(sites.id, siteId)).get();
    if (!site || open?.closedAt || !names(site, trimmed)) return false;
    rotate(tx, siteId, visitorId);
    awardSolve(tx, visitorId);
    return true;
  });
  changed();
  return solved ? "solved" : "posted";
}

export function listTheories(siteId: string, limit = 30): TheoryEntry[] {
  const site = siteFor(siteId);
  const rows = db
    .select({ id: theories.id, author: visitors.name, authorId: theories.visitorId, body: theories.body, postedAt: theories.postedAt })
    .from(theories)
    .innerJoin(visitors, eq(theories.visitorId, visitors.id))
    .where(eq(theories.siteId, siteId))
    .orderBy(desc(theories.id))
    .limit(limit)
    .all();
  if (rows.length === 0) return [];

  const byTheory = new Map<number, Evidence[]>();
  const cited = db
    .select()
    .from(theoryEvidence)
    .where(
      inArray(
        theoryEvidence.theoryId,
        rows.map((r) => r.id),
      ),
    )
    .all();
  for (const { theoryId, row, col } of cited) {
    const cell = site && cellAt(site, row, col);
    if (!cell) continue;
    byTheory.set(theoryId, [...(byTheory.get(theoryId) ?? []), { row, col, cell }]);
  }
  return rows.map((r) => ({ ...r, evidence: byTheory.get(r.id) ?? [] }));
}
