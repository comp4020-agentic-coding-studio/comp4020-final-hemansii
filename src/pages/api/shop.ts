import type { APIRoute } from "astro";
import { audit, type AuditOutcome } from "../../lib/audit";
import { buyDig } from "../../lib/shop";
import { getOrCreateVisitor } from "../../lib/visitor";

const OUTCOMES: Record<string, AuditOutcome> = {
  ok: "ok",
  "not-enough-shards": "rejected",
  "digs-not-exhausted": "rejected",
};

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const { visitor } = getOrCreateVisitor(cookies);
  const result = buyDig(visitor.id);
  audit("buy-dig", visitor, "shop", OUTCOMES[result], { result });
  return redirect(`/?r=buy-${result}`, 303);
};
