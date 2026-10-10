# 1. What happens when two people race for the same cell, live

## Context

Crit 9 makes the grid real-time: a dig or a brush now reaches every open
session within about a second, with no reload. That changes what a race for
the same cell looks like. Before this week, two visitors could only collide
by coincidence, since neither could see what the other was doing. Now a
visitor can watch a cell they're about to click change under them.

The server already resolves the underlying conflict. `dig()` and `brush()` in
`src/lib/dig.ts` run inside a synchronous better-sqlite3 transaction: the
check for whether a cell is already taken, and the write that takes it, can't
interleave with another request's. The first request to reach the database
wins; the second gets `already-dug` or `already-brushed`, surfaced on `/` as a
flash message ("Someone got to that section first," "Someone already brushed
that clean"). That's crit 8's answer, and it already holds.

Real-time adds a question crit 8 didn't have to answer: does the live layer
just report that outcome after the fact, or try to stop the losing click from
happening at all.

## Decision

The server-side first-write-wins check stays the one and only source of
truth. The live layer (`src/lib/events.ts`, `src/pages/api/events.ts`, the
resync script in `src/pages/index.astro`) only pushes onlookers' screens
toward that truth faster, inside about a second; it does not add a second,
client-side notion of "taken."

Concretely: when visitor A digs a cell, every other open session resyncs and
sees that cell stop being a clickable `buried` button. If visitor B's own
click lands in the window before their screen catches up, their POST still
goes to `dig()`, which still returns `already-dug`, and they still see the
existing flash message. The live layer shrinks that window to about a second;
it doesn't try to close it to zero.

## Options considered

1. **Chosen: server-authoritative, live resync narrows the window.** No new
   state to keep consistent. The guarantee a marker or a pod member could
   actually rely on ("can two people successfully dig the same cell?") lives
   in one place, the same place it already lived before this crit.

2. **Optimistic client-side lock.** Grey out a cell the instant it's clicked,
   before the server confirms, so the clicker's own tab reflects "taken"
   immediately. Rejected: it needs rollback handling for the rarer case where
   two people click inside the same event round-trip (whoever's request
   actually lost now has to un-grey a cell they thought they'd taken), and it
   risks a cell reading as locked to everyone watching when the click that
   locked it was about to fail server-side anyway.

3. **Last-write-wins, allow re-digging a taken cell.** Would remove the race
   entirely by letting a later dig simply overwrite an earlier one. Rejected
   outright: crit 8's data model is append-only specifically so a dig records
   who found a section; silently overwriting that contradicts the thing this
   project has been about since week 9.

## Cost

A visitor can still, occasionally, click a cell inside the same second
someone else just took it, and the result is the same slightly deflating flash
message crit 8 already shipped, not a button that was already disabled when
they looked at it. That's accepted: the brief asks for the common case to feel
live, not for the server's guarantee to move into the browser. Trying to make
the browser authoritative would mean maintaining two sources of truth that can
disagree, for a race that, in a five-digs-a-day game, is already rare.
