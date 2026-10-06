import { sql } from "drizzle-orm";
import { index, int, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
//
// A dig only uncovers a section (something's there); brushing is a separate,
// uncapped action, by anyone, not just the digger, that reveals its
// content. brushed_at/brushed_by are null until that happens.
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
    brushedAt: text("brushed_at"),
    brushedBy: text("brushed_by").references(() => visitors.id),
  },
  (t) => [
    index("digs_site_cell").on(t.siteId, t.row, t.col),
    index("digs_visitor_day").on(t.visitorId, t.day),
  ],
);

// Short public messages visitors leave for each other about the current dig.
export const notes = sqliteTable(
  "notes",
  {
    id: int().primaryKey({ autoIncrement: true }),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id),
    visitorId: text("visitor_id")
      .notNull()
      .references(() => visitors.id),
    body: text().notNull(),
    postedAt: text("posted_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index("notes_site").on(t.siteId)],
);

// Open guesses at what the buried site actually was. Never checked against
// the real title, just a feed, so forming a theory can't itself spoil one.
export const theories = sqliteTable(
  "theories",
  {
    id: int().primaryKey({ autoIncrement: true }),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id),
    visitorId: text("visitor_id")
      .notNull()
      .references(() => visitors.id),
    body: text().notNull(),
    postedAt: text("posted_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index("theories_site").on(t.siteId)],
);

// A visitor's personal collection of recovered sections.
export const specimens = sqliteTable(
  "specimens",
  {
    id: int().primaryKey({ autoIncrement: true }),
    visitorId: text("visitor_id")
      .notNull()
      .references(() => visitors.id),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id),
    row: int().notNull(),
    col: int().notNull(),
    addedAt: text("added_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    index("specimens_visitor_site").on(t.visitorId, t.siteId),
    uniqueIndex("specimens_unique").on(t.visitorId, t.siteId, t.row, t.col),
  ],
);

export type Visitor = typeof visitors.$inferSelect;
export type Dig = typeof digs.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Theory = typeof theories.$inferSelect;
export type Specimen = typeof specimens.$inferSelect;
