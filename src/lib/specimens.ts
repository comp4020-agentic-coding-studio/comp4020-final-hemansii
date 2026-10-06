import { and, asc, eq } from "drizzle-orm";
import { type Cell, cellAt, SITES } from "../sites";
import { db } from "./db";
import { specimens } from "./schema";
import { findings } from "./dig";

export type SpecimenEntry = { row: number; col: number; cell: Cell; addedAt: string };

export function addToTray(visitorId: string, siteId: string, row: number, col: number): boolean {
  const site = SITES[siteId];
  if (!site) return false;
  if (!findings(siteId).get(`${row}-${col}`)?.brushedAt) return false;
  db.insert(specimens).values({ visitorId, siteId, row, col }).onConflictDoNothing().run();
  return true;
}

export function removeFromTray(visitorId: string, siteId: string, row: number, col: number): void {
  db.delete(specimens)
    .where(
      and(
        eq(specimens.visitorId, visitorId),
        eq(specimens.siteId, siteId),
        eq(specimens.row, row),
        eq(specimens.col, col),
      ),
    )
    .run();
}

export function trayFor(visitorId: string, siteId: string): SpecimenEntry[] {
  const site = SITES[siteId];
  if (!site) return [];
  const rows = db
    .select({ row: specimens.row, col: specimens.col, addedAt: specimens.addedAt })
    .from(specimens)
    .where(and(eq(specimens.visitorId, visitorId), eq(specimens.siteId, siteId)))
    .orderBy(asc(specimens.id))
    .all();
  return rows.flatMap(({ row, col, addedAt }) => {
    const cell = cellAt(site, row, col);
    return cell ? [{ row, col, cell, addedAt }] : [];
  });
}

export function trayCount(visitorId: string, siteId: string): number {
  return db
    .select({ row: specimens.row })
    .from(specimens)
    .where(and(eq(specimens.visitorId, visitorId), eq(specimens.siteId, siteId)))
    .all().length;
}
