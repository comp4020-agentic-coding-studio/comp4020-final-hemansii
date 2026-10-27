import type { APIRoute } from "astro";
import { audit, type AuditOutcome } from "../../lib/audit";
import { answerTrivia } from "../../lib/trivia";
import { getOrCreateVisitor } from "../../lib/visitor";

const OUTCOMES: Record<string, AuditOutcome> = {
  correct: "ok",
  wrong: "ok",
  "already-answered": "rejected",
};

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { visitor } = getOrCreateVisitor(cookies);
  const form = await request.formData();
  const choice = Number(form.get("choice"));
  const result = answerTrivia(visitor.id, choice);
  audit("trivia", visitor, "daily", OUTCOMES[result], { result });
  return redirect(`/?r=trivia-${result}#trivia`, 303);
};
