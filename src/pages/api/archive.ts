import type { APIRoute } from "astro";
import { audit } from "../../lib/audit";
import { openSite } from "../../lib/dig";
import { addToTray, removeFromTray } from "../../lib/specimens";
import { getOrCreateVisitor } from "../../lib/visitor";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { visitor } = getOrCreateVisitor(cookies);
  const form = await request.formData();
  const [row, col] = String(form.get("cell") ?? "").split("-").map(Number);
  const action = form.get("action") === "remove" ? "remove" : "add";
  const { id: siteId } = openSite();

  let r = "archive-bad-cell";
  const target = Number.isInteger(row) && Number.isInteger(col) ? `${row}-${col}` : String(form.get("cell") ?? "");
  if (Number.isInteger(row) && Number.isInteger(col)) {
    if (action === "remove") {
      const removed = removeFromTray(visitor.id, siteId, row, col);
      r = "unarchived";
      audit("specimen-remove", visitor, target, removed ? "ok" : "rejected");
    } else {
      const added = addToTray(visitor.id, siteId, row, col);
      r = added ? "archived" : "archive-bad-cell";
      audit("specimen-add", visitor, target, added ? "ok" : "rejected");
    }
  } else {
    audit(action === "remove" ? "specimen-remove" : "specimen-add", visitor, target, "rejected");
  }

  // Land back on the cell that was just added/removed, not the top of the
  // page: a reload with no anchor always starts at the top, which otherwise
  // throws the visitor back up every time they touch the tray.
  const anchor = Number.isInteger(row) && Number.isInteger(col) ? `#cell-${row}-${col}` : "";
  const back = request.headers.get("referer");
  const fallback = `/?r=${r}${anchor}`;
  if (!back) return redirect(fallback, 303);
  try {
    const url = new URL(back);
    url.searchParams.set("r", r);
    return redirect(url.pathname + url.search + (anchor || url.hash), 303);
  } catch {
    return redirect(fallback, 303);
  }
};
