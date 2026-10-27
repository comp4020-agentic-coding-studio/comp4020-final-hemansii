import { eq, sql } from "drizzle-orm";
import { digAllowance, digsPurchasedToday, digsToday, today } from "./dig";
import { db } from "./db";
import { changed } from "./events";
import { digPurchases, visitors } from "./schema";

export const SOLVE_REWARD = 50;

export function awardSolve(tx: Pick<typeof db, "update">, visitorId: string): void {
  tx.update(visitors).set({ shards: sql`${visitors.shards} + ${SOLVE_REWARD}` }).where(eq(visitors.id, visitorId)).run();
}

// The nth bonus dig bought today costs 5 + 5n shards: the 1st costs 10, the
// 2nd 15, and so on, so stacking up a huge extra allowance in one day gets
// steadily more expensive rather than staying a flat rate.
export function nextDigCost(visitorId: string): number {
  return 5 + 5 * (digsPurchasedToday(visitorId) + 1);
}

export type BuyResult = "ok" | "not-enough-shards" | "digs-not-exhausted";

// Buying ahead of using up the free allowance is blocked: a bought dig
// should extend today's cap, not let anyone skip the free digs and bank
// shards for later (shards are the scarce resource, not the daily digs).
export function buyDig(visitorId: string): BuyResult {
  const day = today();
  const result = db.transaction((tx) => {
    if (digsToday(visitorId) < digAllowance(visitorId)) return "digs-not-exhausted";
    const cost = nextDigCost(visitorId);
    const visitor = tx.select({ shards: visitors.shards }).from(visitors).where(eq(visitors.id, visitorId)).get();
    if (!visitor || visitor.shards < cost) return "not-enough-shards";
    tx.update(visitors).set({ shards: visitor.shards - cost }).where(eq(visitors.id, visitorId)).run();
    tx.insert(digPurchases).values({ visitorId, day, cost }).run();
    return "ok";
  });
  if (result === "ok") changed();
  return result;
}
