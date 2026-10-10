import { EventEmitter } from "node:events";

// fly.toml pins this app to one machine (`--ha=false`, `min_machines_running
// = 0`), so an in-process bus is enough: there's no second instance that
// could miss an emit. Moving to more than one machine would need a shared
// bus (e.g. Postgres LISTEN/NOTIFY) instead of this.
const bus = new EventEmitter();
bus.setMaxListeners(0);

const topic = (siteId: string): string => `changed:${siteId}`;

// Call after a dig, brush, note or theory lands, so every open session for
// that site can resync. The payload carries no state, just a reason to go
// re-read the truth: listeners re-fetch rather than trust an event body.
export function changed(siteId: string): void {
  bus.emit(topic(siteId));
}

export function subscribe(siteId: string, onChange: () => void): () => void {
  bus.on(topic(siteId), onChange);
  return () => bus.off(topic(siteId), onChange);
}
