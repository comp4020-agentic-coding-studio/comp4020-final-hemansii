import { sql } from "drizzle-orm";
import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Edit here, `pnpm db:generate`, commit the migration it writes to drizzle/.
// Migrations apply at boot (src/lib/db.ts); never edit the deployed DB by hand.

// One row per buried site; the id is the slug of its content in src/sites/.
// closed_at is set when a site rotates into the archive.
export const sites = sqliteTable("sites", {
  id: text().primaryKey(),
  openedAt: text("opened_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  closedAt: text("closed_at"),
});

export const visitors = sqliteTable("visitors", {
  id: text().primaryKey(),
  name: text().notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// Append-only: a section's state is derived from its digs, never stored on it,
// so silting can re-bury a section later without losing who uncovered it.
export const digs = sqliteTable(
  "digs",
  {
    id: int().primaryKey({ autoIncrement: true }),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id),
    row: int().notNull(),
    col: int().notNull(),
    visitorId: text("visitor_id")
      .notNull()
      .references(() => visitors.id),
    dugAt: text("dug_at").notNull(),
    // Canberra calendar date of the dig, so the daily allowance doesn't depend
    // on the server's timezone.
    day: text().notNull(),
  },
  (t) => [
    index("digs_site_cell").on(t.siteId, t.row, t.col),
    index("digs_visitor_day").on(t.visitorId, t.day),
  ],
);

export type Visitor = typeof visitors.$inferSelect;
export type Dig = typeof digs.$inferSelect;
