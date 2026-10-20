import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { changed } from "./events";
import { notes, visitors } from "./schema";

export type NoteEntry = { id: number; author: string; authorId: string; body: string; postedAt: string };

const MAX_LEN = 300;

// Returns whether the note was actually posted (false for blank input, which
// is ignored rather than an error).
export function postNote(visitorId: string, siteId: string, body: string): boolean {
  const trimmed = body.trim().slice(0, MAX_LEN);
  if (!trimmed) return false;
  db.insert(notes).values({ siteId, visitorId, body: trimmed }).run();
  changed();
  return true;
}

export function listNotes(siteId: string, limit = 30): NoteEntry[] {
  return db
    .select({ id: notes.id, author: visitors.name, authorId: notes.visitorId, body: notes.body, postedAt: notes.postedAt })
    .from(notes)
    .innerJoin(visitors, eq(notes.visitorId, visitors.id))
    .where(eq(notes.siteId, siteId))
    .orderBy(desc(notes.id))
    .limit(limit)
    .all();
}
