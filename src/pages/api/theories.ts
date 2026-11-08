import type { APIRoute } from "astro";
import { audit } from "../../lib/audit";
import { openSite } from "../../lib/dig";
import { postTheory } from "../../lib/theories";
import { getOrCreateVisitor } from "../../lib/visitor";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { visitor } = getOrCreateVisitor(cookies);
  const form = await request.formData();
  const { id: siteId } = openSite();
  const evidence = form.getAll("evidence").map(String);
  const body = String(form.get("body") ?? "");
  const result = postTheory(visitor.id, siteId, body, evidence);
  audit("theory", visitor, siteId, result === "rejected" ? "rejected" : "ok", { result });
  const from = String(form.get("from") ?? "");
  if (result === "solved") return redirect("/?r=solved#mystery", 303);
  const r = result === "needs-evidence" ? "theory-needs-evidence" : "theory-ok";
  if (from === "archive") return redirect(`/archive?r=${r}#theories`, 303);
  const anchor = from === "mystery" ? "mystery" : "theories";
  return redirect(`/?r=${r}#${anchor}`, 303);
};
