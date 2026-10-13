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
