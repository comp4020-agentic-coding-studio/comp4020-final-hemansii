import type { APIRoute } from "astro";
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
  if (Number.isInteger(row) && Number.isInteger(col)) {
    if (action === "remove") {
      removeFromTray(visitor.id, siteId, row, col);
      r = "unarchived";
    } else {
      r = addToTray(visitor.id, siteId, row, col) ? "archived" : "archive-bad-cell";
    }
  }

  const back = request.headers.get("referer");
  const fallback = `/?r=${r}`;
  if (!back) return redirect(fallback, 303);
  try {
    const url = new URL(back);
    url.searchParams.set("r", r);
    return redirect(url.pathname + url.search + url.hash, 303);
  } catch {
    return redirect(fallback, 303);
  }
};
