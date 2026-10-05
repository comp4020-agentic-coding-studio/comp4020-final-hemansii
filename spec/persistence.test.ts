import { it } from "vitest";

// crit 8's spec: "it's alive: a stranger can visit, do the core thing, and
// find their trace still there when they come back." invariants.test.ts
// already checks the app answers at all; this is the one line that's new
// this week, and it needs the core interaction decided before it can assert
// anything concrete.
//
// TODO once the core flow exists, replace this with something like:
//   - POST (or otherwise perform) the core action against a running instance
//   - fetch the page a stranger would land on afterwards
//   - assert the trace left by that action is in the response
//
// Leaving this red (not skipped) is deliberate: `pnpm check` should keep
// failing here until the real assertion replaces it.
it("a stranger's action leaves a trace that's still there on a later visit", async () => {
  throw new Error(
    "no core interaction decided yet — replace this test once the app has one (see the TODO above)",
  );
});
