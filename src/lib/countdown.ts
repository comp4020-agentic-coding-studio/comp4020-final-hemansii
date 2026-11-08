// "4h 18m" until an instant, rounded up to the minute so it never reads
// 0m while there's still time to wait. Shared by the server render and the
// page's own countdown so both say the same thing.
export function untilLabel(atMs: number, nowMs = Date.now()): string {
  const mins = Math.max(1, Math.ceil((atMs - nowMs) / 60_000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
