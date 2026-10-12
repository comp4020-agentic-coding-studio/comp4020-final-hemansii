import type { APIRoute } from "astro";
import { openSite } from "../../lib/dig";
import { changed } from "../../lib/events";
import { getOrCreateVisitor, setName } from "../../lib/visitor";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { visitor } = getOrCreateVisitor(cookies);
  const form = await request.formData();
  setName(visitor.id, String(form.get("name") ?? ""));
  // Names show on notes, theories and the dig log, so everyone resyncs.
  changed(openSite().id);
  return redirect("/?r=name-set", 303);
};
