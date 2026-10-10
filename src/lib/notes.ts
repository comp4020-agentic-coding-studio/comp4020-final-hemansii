import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { changed } from "./events";
import { notes, visitors } from "./schema";

export type NoteEntry = { id: number; author: string; body: string; postedAt: string };

const MAX_LEN = 300;

export function postNote(visitorId: string, siteId: string, body: string): void {
  const trimmed = body.trim().slice(0, MAX_LEN);
  if (!trimmed) return;
  db.insert(notes).values({ siteId, visitorId, body: trimmed }).run();
  changed(siteId);
}

export function listNotes(siteId: string, limit = 30): NoteEntry[] {
  return db
    .select({ id: notes.id, author: visitors.name, body: notes.body, postedAt: notes.postedAt })
    .from(notes)
    .innerJoin(visitors, eq(notes.visitorId, visitors.id))
    .where(eq(notes.siteId, siteId))
    .orderBy(desc(notes.id))
    .limit(limit)
    .all();
}
