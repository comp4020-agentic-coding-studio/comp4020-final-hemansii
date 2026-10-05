import type { APIRoute } from "astro";
import { dig } from "../../lib/dig";
import { getOrCreateVisitor } from "../../lib/visitor";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const visitor = getOrCreateVisitor(cookies);
  const form = await request.formData();
  const [row, col] = String(form.get("cell") ?? "").split("-").map(Number);

  const result = dig(visitor.id, row, col);
  const anchor = result === "out-of-range" ? "" : `#cell-${row}-${col}`;
  return redirect(`/?r=${result}${anchor}`, 303);
};
