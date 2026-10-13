import type { APIRoute } from "astro";
import { openSite } from "../../lib/dig";
import { setSpecimenNote } from "../../lib/specimens";
import { getOrCreateVisitor } from "../../lib/visitor";

// Saves the visitor's own note on a find in their tray. Private, so nothing
// is broadcast: no other session ever shows it.
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { visitor } = getOrCreateVisitor(cookies);
  const form = await request.formData();
  const key = String(form.get("cell") ?? "");
  const [row, col] = key.split("-").map(Number);
  const { id: siteId } = openSite();
  const ok =
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    setSpecimenNote(visitor.id, siteId, row, col, String(form.get("note") ?? ""));
  return redirect(`/archive?r=${ok ? "specimen-noted" : "archive-bad-cell"}#specimen-${key}`, 303);
};
