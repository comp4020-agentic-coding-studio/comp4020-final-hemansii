#!/usr/bin/env node
// Stress test for the brief's top band: "two people acting at once". Fires
// truly concurrent requests at a running app and then checks the database
// directly, so a race the HTTP replies hide (two rows for one cell, shards
// below zero, a site closed twice) still shows up.
//
// Run it against a throwaway instance, never the shared one:
//   DATABASE_PATH=/tmp/stress.db PORT=8090 node dist/server/entry.mjs &
//   APP_URL=http://localhost:8090 DATABASE_PATH=/tmp/stress.db node scripts/stress.ts
import Database from "better-sqlite3";

const BASE = process.env.APP_URL ?? "http://localhost:8090";
const DB_PATH = process.env.DATABASE_PATH ?? "/tmp/stress.db";
const ORIGIN = new URL(BASE).origin;

let failures = 0;
const check = (ok: boolean, label: string, detail = ""): void => {
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures++;
};

class Player {
  cookie = "";
  async visit(path = "/"): Promise<string> {
    const res = await fetch(new URL(path, BASE), { headers: this.cookie ? { cookie: this.cookie } : {} });
    this.keep(res);
    return res.text();
  }
  async post(path: string, body: Record<string, string>): Promise<string | null> {
    const res = await fetch(new URL(path, BASE), {
      method: "POST",
      redirect: "manual",
      headers: { origin: ORIGIN, "content-type": "application/x-www-form-urlencoded", ...(this.cookie ? { cookie: this.cookie } : {}) },
      body: new URLSearchParams(body),
    });
    this.keep(res);
    if (res.status >= 500) return `HTTP ${res.status}`;
    const loc = res.headers.get("location");
    return loc ? new URL(loc, BASE).searchParams.get("r") : `HTTP ${res.status}`;
  }
  get id(): string {
    return /digger=([^;]+)/.exec(this.cookie)?.[1] ?? "";
  }
  private keep(res: Response): void {
    const set = res.headers.getSetCookie().map((c) => c.split(";")[0]);
    if (set.length) this.cookie = set.join("; ");
  }
}

// The accepted answer per site, as in src/sites/famous.ts.
const ANSWERS: Record<string, string> = {
  "site-1": "club penguin",
  "site-2": "myspace",
  "site-3": "neopets",
  "site-4": "bebo",
  "site-5": "miniclip",
};

const db = new Database(DB_PATH);
const openSiteId = (): string => (db.prepare("select id from sites where closed_at is null").get() as { id: string }).id;
const tally = (results: (string | null)[]): Record<string, number> =>
  results.reduce<Record<string, number>>((t, r) => ((t[r ?? "null"] = (t[r ?? "null"] ?? 0) + 1), t), {});
const players = async (n: number): Promise<Player[]> => {
  const ps = Array.from({ length: n }, () => new Player());
  await Promise.all(ps.map((p) => p.visit()));
  return ps;
};
// Buried cells in reading order, from the database rather than the page.
const buried = (siteId: string): string[] => {
  const dug = new Set((db.prepare("select row, col from digs where site_id = ?").all(siteId) as { row: number; col: number }[]).map((d) => `${d.row}-${d.col}`));
  const out: string[] = [];
  for (let r = 0; r < 10; r++) for (let c = 0; c < 6; c++) if (!dug.has(`${r}-${c}`)) out.push(`${r}-${c}`);
  return out;
};

async function sameCellDig(): Promise<void> {
  console.log("\n1. 30 visitors dig the same cell at once");
  const site = openSiteId();
  const cell = buried(site)[0];
  const ps = await players(30);
  const results = await Promise.all(ps.map((p) => p.post("/api/dig", { cell })));
  const t = tally(results);
  const [row, col] = cell.split("-").map(Number);
  const rows = (db.prepare("select count(*) n from digs where site_id = ? and row = ? and col = ?").get(site, row, col) as { n: number }).n;
  check(t.ok === 1, "exactly one dig wins", JSON.stringify(t));
  check((t["already-dug"] ?? 0) === 29, "the other 29 are told someone got there first");
  check(rows === 1, "exactly one digs row for the cell", `${rows} rows`);
}

async function sameCellBrush(): Promise<void> {
  console.log("\n2. 30 visitors brush the same dusty cell at once");
  const site = openSiteId();
  const cell = buried(site)[0];
  const digger = (await players(1))[0];
  await digger.post("/api/dig", { cell });
  const ps = await players(30);
  const results = await Promise.all(ps.map((p) => p.post("/api/brush", { cell })));
  const t = tally(results);
  const [row, col] = cell.split("-").map(Number);
  const brushers = db.prepare("select brushed_by from digs where site_id = ? and row = ? and col = ?").all(site, row, col) as { brushed_by: string }[];
  check(t.brushed === 1, "exactly one brush wins", JSON.stringify(t));
  check(brushers.length === 1 && ps.some((p) => p.id === brushers[0].brushed_by), "one recorded brusher, and it's one of the racers");
}

async function digCapBurst(): Promise<void> {
  console.log("\n3. one visitor fires 15 digs at different cells at once");
  const site = openSiteId();
  const cells = buried(site).slice(0, 15);
  const [p] = await players(1);
  const results = await Promise.all(cells.map((cell) => p.post("/api/dig", { cell })));
  const t = tally(results);
  const rows = (db.prepare("select count(*) n from digs where visitor_id = ?").get(p.id) as { n: number }).n;
  check(t.ok === 5, "exactly 5 succeed", JSON.stringify(t));
  check(rows === 5, "exactly 5 digs rows, never 6", `${rows} rows`);
}

async function doubleBuy(): Promise<void> {
  console.log("\n4. a visitor with exactly 10 shards fires 10 buys at once");
  const site = openSiteId();
  const [p] = await players(1);
  for (const cell of buried(site).slice(0, 5)) await p.post("/api/dig", { cell });
  db.prepare("update visitors set shards = 10 where id = ?").run(p.id);
  const results = await Promise.all(Array.from({ length: 10 }, () => p.post("/api/shop", {})));
  const t = tally(results);
  const shards = (db.prepare("select shards from visitors where id = ?").get(p.id) as { shards: number }).shards;
  const bought = (db.prepare("select count(*) n from dig_purchases where visitor_id = ?").get(p.id) as { n: number }).n;
  check(t["buy-ok"] === 1, "exactly one purchase goes through", JSON.stringify(t));
  check(bought === 1, "exactly one purchase row", `${bought} rows`);
  check(shards === 0, "shards end at 0, never negative", `${shards}`);
}

// The race above is settled by "use your free digs first", not by the
// shard check. Here every buy would be allowed on its own, and the balance
// is what runs out: 25 shards buys the 10 then the 15, never a third.
async function shardsRunOut(): Promise<void> {
  console.log("\n4b. 25 shards, out of digs, 10 buys at once each followed by a dig");
  const site = openSiteId();
  const [p] = await players(1);
  const free = buried(site);
  for (const cell of free.slice(0, 5)) await p.post("/api/dig", { cell });
  db.prepare("update visitors set shards = 25 where id = ?").run(p.id);
  // buy, then spend it straight away, so the next buy is legal again
  let next = 5;
  const results = await Promise.all(
    Array.from({ length: 10 }, async () => {
      const r = await p.post("/api/shop", {});
      if (r === "buy-ok") await p.post("/api/dig", { cell: free[next++] });
      return r;
    }),
  );
  const t = tally(results);
  const shards = (db.prepare("select shards from visitors where id = ?").get(p.id) as { shards: number }).shards;
  const spent = (db.prepare("select coalesce(sum(cost), 0) s from dig_purchases where visitor_id = ?").get(p.id) as { s: number }).s;
  check(shards >= 0, "shards never go negative", `${shards} left`);
  check(spent + shards === 25, "every shard is accounted for", `spent ${spent} + left ${shards}`);
  check(spent <= 25, "never spends more than it had", `spent ${spent}`);
  console.log(`   outcomes ${JSON.stringify(t)}`);
}

async function doubleSolve(): Promise<void> {
  console.log("\n5. 20 visitors post the right answer at the same instant");
  const site = openSiteId();
  const answer = ANSWERS[site.split("~")[0]];
  const ps = await players(20);
  const closedBefore = (db.prepare("select count(*) n from sites where closed_at is not null").get() as { n: number }).n;
  const results = await Promise.all(ps.map((p) => p.post("/api/theories", { body: `it's ${answer}` })));
  const t = tally(results);
  const closed = db.prepare("select solved_by from sites where id = ?").get(site) as { solved_by: string | null };
  const closedAfter = (db.prepare("select count(*) n from sites where closed_at is not null").get() as { n: number }).n;
  const open = (db.prepare("select count(*) n from sites where closed_at is null").get() as { n: number }).n;
  const paid = ps.filter((p) => (db.prepare("select shards from visitors where id = ?").get(p.id) as { shards: number }).shards > 0);
  check(t.solved === 1, "exactly one theory solves it", JSON.stringify(t));
  check(closedAfter - closedBefore === 1, "the site closes exactly once");
  check(open === 1, "exactly one open site afterwards, never zero or two", `${open} open`);
  check(paid.length === 1 && paid[0].id === closed.solved_by, "one reward paid, to the recorded solver");
}

async function triviaDouble(): Promise<void> {
  console.log("\n6. one visitor submits trivia 10 times at once");
  const [p] = await players(1);
  const results = await Promise.all(Array.from({ length: 10 }, () => p.post("/api/trivia", { choice: "1" })));
  const t = tally(results);
  const rows = (db.prepare("select count(*) n from trivia_answers where visitor_id = ?").get(p.id) as { n: number }).n;
  const answered = (t["trivia-correct"] ?? 0) + (t["trivia-wrong"] ?? 0);
  check(answered === 1, "exactly one answer is scored", JSON.stringify(t));
  check(rows === 1, "exactly one trivia row", `${rows} rows`);
}

// Opens n /api/events streams and counts the "changed" messages each gets.
async function listeners(n: number): Promise<{ counts: number[]; close: () => void }> {
  const counts = new Array(n).fill(0);
  const ctrls: AbortController[] = [];
  await Promise.all(
    counts.map(async (_, i) => {
      const ctrl = new AbortController();
      ctrls.push(ctrl);
      const res = await fetch(new URL("/api/events", BASE), { signal: ctrl.signal });
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      void (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) return;
            counts[i] += (dec.decode(value).match(/data: changed/g) ?? []).length;
          }
        } catch {}
      })();
    }),
  );
  return { counts, close: () => ctrls.forEach((c) => c.abort()) };
}

async function loadAndFanout(): Promise<void> {
  console.log("\n7. 40 open live sessions while 60 visitors dig and brush at once");
  const live = await listeners(40);
  await new Promise((r) => setTimeout(r, 300));
  const site = openSiteId();
  const cells = buried(site);
  const ps = await players(60);
  const timings: number[] = [];
  const timed = async (fn: () => Promise<string | null>): Promise<string | null> => {
    const t0 = performance.now();
    const r = await fn();
    timings.push(performance.now() - t0);
    return r;
  };
  // each visitor digs a distinct cell, then a different visitor brushes it
  const digs = await Promise.all(ps.map((p, i) => timed(() => p.post("/api/dig", { cell: cells[i % cells.length] }))));
  const okDigs = digs.filter((r) => r === "ok").length;
  const brushes = await Promise.all(ps.map((p, i) => timed(() => p.post("/api/brush", { cell: cells[(i + 1) % cells.length] }))));
  const okBrushes = brushes.filter((r) => r === "brushed").length;
  await new Promise((r) => setTimeout(r, 800));
  live.close();
  const errors = [...digs, ...brushes].filter((r) => r?.startsWith("HTTP")).length;
  const sorted = [...timings].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const changes = okDigs + okBrushes;
  const heardAll = live.counts.filter((c) => c >= changes).length;
  check(errors === 0, "no request fails", `${errors} errors of ${timings.length}`);
  check(okDigs === Math.min(60, cells.length), "every visitor's dig on a free cell lands", `${okDigs} ok`);
  check(heardAll === 40, "all 40 live sessions hear every change", `${heardAll}/40 got >= ${changes}; min ${Math.min(...live.counts)}`);
  check(p95 < 1000, "p95 response under a second", `p50 ${p50.toFixed(0)}ms, p95 ${p95.toFixed(0)}ms`);
}

// The app migrates its database on first load, so touch it before reading.
await new Player().visit();
const scenario = process.argv[2];
const all: Record<string, () => Promise<void>> = { sameCellDig, sameCellBrush, digCapBurst, doubleBuy, shardsRunOut, doubleSolve, triviaDouble, loadAndFanout };
for (const [name, fn] of Object.entries(all)) {
  if (!scenario || scenario === name) await fn();
}
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
