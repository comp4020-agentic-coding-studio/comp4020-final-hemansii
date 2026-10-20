import { createHash } from "node:crypto";

// Server-side action log: one line per state-changing request, written to
// stdout so Fly collects it (`mise exec -- flyctl logs -a <repo>`). Crit 10
// is narrated from this alone, with no UI involved, so every dig, brush,
// field note, theory, specimen change and rename calls this at its API
// route, right where the result (ok, rejected, or a race with someone
// else) is already known.
//
// `visitor.id` is the same value stored in the digger cookie (see
// src/lib/visitor.ts), so it's effectively a bearer token: logging it in
// full would let anyone reading the log impersonate that visitor. Only a
// one-way hash of it appears here, stable enough to tell two visitors
// apart across log lines without exposing the cookie itself.
type LoggedVisitor = { id: string; name: string };

// "ok": the action happened. "rejected": the server refused it outright
// (blank input, over the daily cap, not yours to change). "conflict":
// another visitor's action got there first, the same cell or fact someone
// else just claimed.
export type AuditOutcome = "ok" | "rejected" | "conflict";

export const visitorRef = (id: string): string => createHash("sha256").update(id).digest("hex").slice(0, 8);

const needsQuoting = /[\s"=]/;
const field = (value: string | number | boolean): string =>
  typeof value === "string" && needsQuoting.test(value) ? JSON.stringify(value) : String(value);

export function audit(
  action: string,
  visitor: LoggedVisitor,
  target: string,
  outcome: AuditOutcome,
  detail: Record<string, string | number | boolean> = {},
): void {
  const fields: [string, string | number | boolean][] = [
    ["action", action],
    ["visitor", visitor.name],
    ["ref", visitorRef(visitor.id)],
    ["target", target],
    ["outcome", outcome],
    ...Object.entries(detail),
  ];
  const line = fields.map(([k, v]) => `${k}=${field(v)}`).join(" ");
  console.log(`${new Date().toISOString()} ${line}`);
}
