import { sql } from "drizzle-orm";
import { index, int, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// Edit here, `pnpm db:generate`, commit the migration it writes to drizzle/.
// Migrations apply at boot (src/lib/db.ts); never edit the deployed DB by hand.

// One row per buried site; the id is the slug of its content in src/sites/.
// closed_at is set when a site rotates out (named in a theory, or brushed
// clean), and solved_by is whoever's theory named it, if anyone did.
export const sites = sqliteTable("sites", {
  id: text().primaryKey(),
  openedAt: text("opened_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  closedAt: text("closed_at"),
  solvedBy: text("solved_by"),
});

export const visitors = sqliteTable("visitors", {
  id: text().primaryKey(),
  name: text().notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  // Earned by solving a site and by the daily trivia question; spent on
  // bonus digs. triviaStreak/lastTriviaDay track consecutive correct days.
  shards: int().notNull().default(0),
  triviaStreak: int("trivia_streak").notNull().default(0),
  lastTriviaDay: text("last_trivia_day"),
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

// A visitor's personal collection of recovered sections, each with an
// optional note of their own (what they make of it, what it goes with).
// Private: only ever read back for the visitor who saved it.
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
    note: text(),
    addedAt: text("added_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    index("specimens_visitor_site").on(t.visitorId, t.siteId),
    uniqueIndex("specimens_unique").on(t.visitorId, t.siteId, t.row, t.col),
  ],
);

// The sections a theory cites as evidence, picked from its author's tray
// when it was posted. Keyed by cell rather than by specimen row, so the
// citation stands even if the author later takes the find out of their tray.
export const theoryEvidence = sqliteTable(
  "theory_evidence",
  {
    theoryId: int("theory_id")
      .notNull()
      .references(() => theories.id),
    row: int().notNull(),
    col: int().notNull(),
  },
  (t) => [uniqueIndex("theory_evidence_unique").on(t.theoryId, t.row, t.col)],
);

// One attempt per visitor per Canberra day at the day's trivia question
// (src/lib/trivia.ts picks which question that is). Recorded whether right
// or wrong, so a visitor can't retry the same day for another shot at the
// streak.
export const triviaAnswers = sqliteTable(
  "trivia_answers",
  {
    id: int().primaryKey({ autoIncrement: true }),
    visitorId: text("visitor_id")
      .notNull()
      .references(() => visitors.id),
    day: text().notNull(),
    correct: int({ mode: "boolean" }).notNull(),
    answeredAt: text("answered_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex("trivia_answers_unique").on(t.visitorId, t.day)],
);

// Append-only, like digs: one row per bonus dig bought, so "how many has
// this visitor bought today" (what the next one costs) is derived rather
// than stored, the same pattern as digsToday().
export const digPurchases = sqliteTable(
  "dig_purchases",
  {
    id: int().primaryKey({ autoIncrement: true }),
    visitorId: text("visitor_id")
      .notNull()
      .references(() => visitors.id),
    day: text().notNull(),
    cost: int().notNull(),
    purchasedAt: text("purchased_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index("dig_purchases_visitor_day").on(t.visitorId, t.day)],
);

export type Visitor = typeof visitors.$inferSelect;
export type Dig = typeof digs.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Theory = typeof theories.$inferSelect;
export type Specimen = typeof specimens.$inferSelect;
export type TriviaAnswer = typeof triviaAnswers.$inferSelect;
export type DigPurchase = typeof digPurchases.$inferSelect;
