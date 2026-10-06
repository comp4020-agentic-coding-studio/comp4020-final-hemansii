import type { APIRoute } from "astro";
import { openSite } from "../../lib/dig";
import { postNote } from "../../lib/notes";
import { getOrCreateVisitor } from "../../lib/visitor";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { visitor } = getOrCreateVisitor(cookies);
  const form = await request.formData();
  const { id: siteId } = openSite();
  postNote(visitor.id, siteId, String(form.get("body") ?? ""));
  return redirect("/?r=note-ok#notes", 303);
};
