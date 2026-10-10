import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { changed } from "./events";
import { theories, visitors } from "./schema";

export type TheoryEntry = { id: number; author: string; body: string; postedAt: string };

const MAX_LEN = 300;

export function postTheory(visitorId: string, siteId: string, body: string): void {
  const trimmed = body.trim().slice(0, MAX_LEN);
  if (!trimmed) return;
  db.insert(theories).values({ siteId, visitorId, body: trimmed }).run();
  changed(siteId);
}

export function listTheories(siteId: string, limit = 30): TheoryEntry[] {
  return db
    .select({ id: theories.id, author: visitors.name, body: theories.body, postedAt: theories.postedAt })
    .from(theories)
    .innerJoin(visitors, eq(theories.visitorId, visitors.id))
    .where(eq(theories.siteId, siteId))
    .orderBy(desc(theories.id))
    .limit(limit)
    .all();
}
