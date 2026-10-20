import type { APIRoute } from "astro";
import { audit, type AuditOutcome } from "../../lib/audit";
import { brush } from "../../lib/dig";
import { getOrCreateVisitor } from "../../lib/visitor";

const OUTCOMES: Record<string, AuditOutcome> = {
  brushed: "ok",
  "already-brushed": "conflict",
  "nothing-there": "rejected",
  "out-of-range": "rejected",
};

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { visitor } = getOrCreateVisitor(cookies);
  const form = await request.formData();
  const [row, col] = String(form.get("cell") ?? "").split("-").map(Number);

  const result = brush(visitor.id, row, col);
  audit("brush", visitor, `${row}-${col}`, OUTCOMES[result], { result });
  const anchor = result === "out-of-range" ? "" : `#cell-${row}-${col}`;
  return redirect(`/?r=${result}${anchor}`, 303);
};
