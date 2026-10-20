import type { APIRoute } from "astro";
import { audit } from "../../lib/audit";
import { changed } from "../../lib/events";
import { getOrCreateVisitor, setName } from "../../lib/visitor";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { visitor } = getOrCreateVisitor(cookies);
  const form = await request.formData();
  const requested = String(form.get("name") ?? "");
  const renamed = setName(visitor.id, requested);
  audit("rename", visitor, requested.trim().slice(0, 40) || "(blank)", renamed ? "ok" : "rejected");
  // Names show on notes, theories and the dig log, so everyone resyncs.
  if (renamed) changed();
  return redirect("/?r=name-set", 303);
};
