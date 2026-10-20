import type { APIRoute } from "astro";
import { audit, type AuditOutcome } from "../../lib/audit";
import { dig } from "../../lib/dig";
import { getOrCreateVisitor } from "../../lib/visitor";

const OUTCOMES: Record<string, AuditOutcome> = {
  ok: "ok",
  "already-dug": "conflict",
  "out-of-digs": "rejected",
  "out-of-range": "rejected",
};

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { visitor } = getOrCreateVisitor(cookies);
  const form = await request.formData();
  const [row, col] = String(form.get("cell") ?? "").split("-").map(Number);

  const result = dig(visitor.id, row, col);
  audit("dig", visitor, `${row}-${col}`, OUTCOMES[result], { result });
  const anchor = result === "out-of-range" ? "" : `#cell-${row}-${col}`;
  return redirect(`/?r=${result}${anchor}`, 303);
};
