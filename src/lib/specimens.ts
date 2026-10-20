import { and, asc, eq } from "drizzle-orm";
import { type Cell, cellAt, siteFor } from "../sites";
import { db } from "./db";
import { specimens } from "./schema";
import { findings } from "./dig";

// Everything the evidence table shows about a saved find: where it came
// from, who dug and brushed it, and the visitor's own note on it.
export type SpecimenEntry = {
  row: number;
  col: number;
  cell: Cell;
  addedAt: string;
  note: string;
  finder: string;
  brusher: string | null;
};

export const NOTE_MAX = 200;

// Fragment kinds in the words a field archaeologist would file them under.
export const KIND_LABELS: Record<string, string> = {
  banner: "Title banner",
  nav: "Navigation link",
  side: "Sidebar furniture",
  body: "Page text",
  guest: "Guestbook entry",
  footer: "Page footer",
};

export function addToTray(visitorId: string, siteId: string, row: number, col: number): boolean {
  const site = siteFor(siteId);
  if (!site) return false;
  if (!findings(siteId).get(`${row}-${col}`)?.brushedAt) return false;
  db.insert(specimens).values({ visitorId, siteId, row, col }).onConflictDoNothing().run();
  return true;
}

// Returns whether a row was actually removed, so the caller can tell a real
// removal from a request for a cell that was never in the tray.
export function removeFromTray(visitorId: string, siteId: string, row: number, col: number): boolean {
  return db.delete(specimens).where(and(...mine(visitorId, siteId, row, col))).run().changes > 0;
}

// Saves (or, given an empty note, clears) the visitor's note on a find in
// their own tray. Returns false if the find isn't in their tray.
export function setSpecimenNote(visitorId: string, siteId: string, row: number, col: number, note: string): boolean {
  const trimmed = note.trim().slice(0, NOTE_MAX);
  const res = db
    .update(specimens)
    .set({ note: trimmed || null })
    .where(and(...mine(visitorId, siteId, row, col)))
    .run();
  return res.changes > 0;
}

export function trayFor(visitorId: string, siteId: string): SpecimenEntry[] {
  const site = siteFor(siteId);
  if (!site) return [];
  const found = findings(siteId);
  const rows = db
    .select({ row: specimens.row, col: specimens.col, addedAt: specimens.addedAt, note: specimens.note })
    .from(specimens)
    .where(and(eq(specimens.visitorId, visitorId), eq(specimens.siteId, siteId)))
    .orderBy(asc(specimens.id))
    .all();
  return rows.flatMap(({ row, col, addedAt, note }) => {
    const cell = cellAt(site, row, col);
    const f = found.get(`${row}-${col}`);
    return cell && f ? [{ row, col, cell, addedAt, note: note ?? "", finder: f.finder, brusher: f.brusher }] : [];
  });
}

export function trayCount(visitorId: string, siteId: string): number {
  return db
    .select({ row: specimens.row })
    .from(specimens)
    .where(and(eq(specimens.visitorId, visitorId), eq(specimens.siteId, siteId)))
    .all().length;
}

const mine = (visitorId: string, siteId: string, row: number, col: number) => [
  eq(specimens.visitorId, visitorId),
  eq(specimens.siteId, siteId),
  eq(specimens.row, row),
  eq(specimens.col, col),
];
