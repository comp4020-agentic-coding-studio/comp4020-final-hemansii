import type { APIRoute } from "astro";
import { openSite } from "../../lib/dig";
import { postTheory } from "../../lib/theories";
import { getOrCreateVisitor } from "../../lib/visitor";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { visitor } = getOrCreateVisitor(cookies);
  const form = await request.formData();
  const { id: siteId } = openSite();
  const evidence = form.getAll("evidence").map(String);
  const solved = postTheory(visitor.id, siteId, String(form.get("body") ?? ""), evidence);
  const from = String(form.get("from") ?? "");
  if (solved) return redirect("/?r=solved#mystery", 303);
  if (from === "archive") return redirect("/archive?r=theory-ok#theories", 303);
  const anchor = from === "mystery" ? "mystery" : "theories";
  return redirect(`/?r=theory-ok#${anchor}`, 303);
};
