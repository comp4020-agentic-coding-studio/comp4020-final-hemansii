import type { APIRoute } from "astro";
import { getOrCreateVisitor, setName } from "../../lib/visitor";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { visitor } = getOrCreateVisitor(cookies);
  const form = await request.formData();
  setName(visitor.id, String(form.get("name") ?? ""));
  return redirect("/?r=name-set", 303);
};
