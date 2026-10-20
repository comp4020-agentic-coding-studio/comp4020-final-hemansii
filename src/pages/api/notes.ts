import type { APIRoute } from "astro";
import { audit } from "../../lib/audit";
import { openSite } from "../../lib/dig";
import { postNote } from "../../lib/notes";
import { getOrCreateVisitor } from "../../lib/visitor";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { visitor } = getOrCreateVisitor(cookies);
  const form = await request.formData();
  const { id: siteId } = openSite();
  const posted = postNote(visitor.id, siteId, String(form.get("body") ?? ""));
  audit("note", visitor, siteId, posted ? "ok" : "rejected");
  return redirect("/?r=note-ok#notes", 303);
};
