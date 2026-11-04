import { EventEmitter } from "node:events";

// fly.toml pins this app to one machine (`--ha=false`, `min_machines_running
// = 0`), so an in-process bus is enough: there's no second instance that
// could miss an emit. Moving to more than one machine would need a shared
// bus (e.g. Postgres LISTEN/NOTIFY) instead of this.
const bus = new EventEmitter();
bus.setMaxListeners(0);

// One topic, not one per site: when a site is solved and the next one opens,
// every session still watching the old one has to hear about it too.
const TOPIC = "changed";

// Call after a dig, brush, note or theory lands, so every open session can
// resync. The payload carries no state, just a reason to go re-read the
// truth: listeners re-fetch rather than trust an event body.
export function changed(): void {
  bus.emit(TOPIC);
}

export function subscribe(onChange: () => void): () => void {
  bus.on(TOPIC, onChange);
  return () => bus.off(TOPIC, onChange);
}

// How many tabs currently hold an open /api/events connection: a rough
// stand-in for "people here right now", good enough for a number on the
// page rather than an attendance record. One person with two tabs open
// counts twice, and a dropped connection takes until the browser notices
// (or the next ping) to leave; neither is worth a cookie-keyed presence
// table for what's a vibe, not a claim the UI enforces.
let liveCount = 0;
const PRESENCE_TOPIC = "presence";

export function currentlyHere(): number {
  return liveCount;
}

export function presenceJoin(): void {
  liveCount += 1;
  bus.emit(PRESENCE_TOPIC, liveCount);
}

export function presenceLeave(): void {
  liveCount = Math.max(0, liveCount - 1);
  bus.emit(PRESENCE_TOPIC, liveCount);
}

export function subscribePresence(onCount: (count: number) => void): () => void {
  bus.on(PRESENCE_TOPIC, onCount);
  return () => bus.off(PRESENCE_TOPIC, onCount);
}
