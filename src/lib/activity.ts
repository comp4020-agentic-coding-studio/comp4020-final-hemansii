import { alias } from "drizzle-orm/sqlite-core";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { gridRef } from "../sites";
import { db } from "./db";
import { digs, visitors } from "./schema";

export type Activity = { who: string; verb: "uncovered" | "brushed clean"; ref: string; at: string };

// Derived from the append-only digs table, so the log needs no table of its
// own. Digs and brushes are read separately because a fresh brush can land
// on a section that was dug long ago.
export function recentActivity(siteId: string, limit = 6): Activity[] {
  const dug = db
    .select({ row: digs.row, col: digs.col, who: visitors.name, at: digs.dugAt })
    .from(digs)
    .innerJoin(visitors, eq(digs.visitorId, visitors.id))
    .where(eq(digs.siteId, siteId))
    .orderBy(desc(digs.dugAt))
    .limit(limit)
    .all()
    .map((r) => ({ who: r.who, verb: "uncovered" as const, ref: gridRef(r.row, r.col), at: r.at }));

  const brushers = alias(visitors, "brushers");
  const brushed = db
    .select({ row: digs.row, col: digs.col, who: brushers.name, at: digs.brushedAt })
    .from(digs)
    .innerJoin(brushers, eq(digs.brushedBy, brushers.id))
    .where(and(eq(digs.siteId, siteId), isNotNull(digs.brushedAt)))
    .orderBy(desc(digs.brushedAt))
    .limit(limit)
    .all()
    .map((r) => ({ who: r.who, verb: "brushed clean" as const, ref: gridRef(r.row, r.col), at: r.at ?? "" }));

  return [...dug, ...brushed].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
