import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { FIRST_SITE } from "../sites";
import { sites } from "./schema";

// fly.toml points DATABASE_PATH at the volume (/data); locally it's an
// untracked file in .data/.
const path = process.env.DATABASE_PATH ?? "./.data/app.db";
mkdirSync(dirname(path), { recursive: true });

const client = new Database(path);
client.pragma("journal_mode = WAL");

export const db = drizzle(client);

migrate(db, { migrationsFolder: "./drizzle" });

if (!db.select().from(sites).where(isNull(sites.closedAt)).get()) {
  db.insert(sites).values({ id: FIRST_SITE }).onConflictDoNothing().run();
}
