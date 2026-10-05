import { randomBytes, randomInt } from "node:crypto";
import type { AstroCookies } from "astro";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { type Visitor, visitors } from "./schema";

const COOKIE = "digger";
const ONE_YEAR_S = 365 * 24 * 60 * 60;

const ADJECTIVES = ["Dusty", "Patient", "Muddy", "Careful", "Curious", "Sunburnt", "Quiet", "Eager"];
const NOUNS = ["Trowel", "Brush", "Sieve", "Shovel", "Lantern", "Pickaxe", "Bucket", "Spade"];

const pseudonym = (): string =>
  `${ADJECTIVES[randomInt(ADJECTIVES.length)]} ${NOUNS[randomInt(NOUNS.length)]} ${randomInt(10, 100)}`;

export function findVisitor(cookies: AstroCookies): Visitor | undefined {
  const id = cookies.get(COOKIE)?.value;
  return id ? db.select().from(visitors).where(eq(visitors.id, id)).get() : undefined;
}

export function getOrCreateVisitor(cookies: AstroCookies): Visitor {
  const existing = findVisitor(cookies);
  if (existing) return existing;

  const visitor = db
    .insert(visitors)
    .values({ id: randomBytes(16).toString("hex"), name: pseudonym() })
    .returning()
    .get();
  cookies.set(COOKIE, visitor.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: import.meta.env.PROD,
    maxAge: ONE_YEAR_S,
  });
  return visitor;
}
