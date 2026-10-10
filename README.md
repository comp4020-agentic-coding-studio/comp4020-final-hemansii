# The Dig

The Dig is a shared, persistent excavation game. Visitors get a capped
number of digs a day, brush what they uncover, and slowly reconstruct one
buried website together: a pastiche of a personal homepage from the late
1990s, revealed one grid cell at a time. Finds go in a specimen tray, and
visitors leave field notes and theories for each other about what the
site used to be.

## What good means here

For a crit called "it's alive", good means the world is actually shared,
not merely rendered per visitor: a dig, a brushed find, a note or a
theory posted by one visitor has to be visible to the next one who loads
the page, with nothing lost on restart. `spec/persistence.test.ts` and
`spec/dig-limit.test.ts` check that mechanically. Whether the act of
digging and brushing itself feels like excavating something, rather than
clicking a counter up, is not something a test can check and is left to
be judged.

The second half of good is visual. The brief for this crit asked for a
restyle grounded in reference art, two Hergé Tintin covers, for the flat
colour, confident black linework and poster typography of ligne claire,
and then, in a second pass, for something wider and calmer: an editorial
layout where the board is the page, not a centred dashboard beside three
stacked cards. Neither of those is enforced by a test. Whether the result
reads as one illustrated place rather than a reskinned form is a
judgement call, and the honest answer is it took two full passes, plus a
deliberate decision not to touch the data model or the no-JavaScript
`:target` animation technique, to get there without breaking what the
spec does check.

For a crit called "all at once", good also means the shared world updates
live: a dig, a brush, a note or a theory posted by one visitor reaches every
other open session within about a second, with no reload, not just on their
next page load. `spec/realtime.test.ts` checks that mechanically. What
happens when two visitors reach for the same cell inside that same second is
written down in
[`docs/decisions/0001-live-same-cell-race.md`](docs/decisions/0001-live-same-cell-race.md),
with the options considered and what the choice costs. Whether the live
layer reads as a shared room rather than everyone quietly polling the same
page is not something a test can check and is left to be judged.

## What this doesn't do

No decay ("silting") of untouched tiles over time, though the schema already
timestamps every dig, so that is one migration away rather than a rewrite.
No second buried site or an archive of closed ones; `sites.closedAt` exists
in the schema for exactly that and isn't used yet. Both were left out on
purpose rather than half built, so the one site that does exist works
properly.

## Enforced versus judged

Enforced, in `spec/`: the app answers at `/`, `/readme/` publishes this
file's headings in order, a dig and a brush persist and are visible to
every visitor, each visitor gets exactly `DIGS_PER_DAY` digs, a
section's content never reaches the page before it has been brushed, and
a dig, brush, note or theory reaches another open session over
`/api/events` within a bounded time, with no reload.

Judged, not tested: whether the three tile states, buried, dusty,
revealed, read as a real excavation instead of three colours, whether the
specimen tray and the field notes and theories feel like one
collaborative investigation rather than three unrelated widgets bolted
onto a grid, whether the typography and layout choices in `CLAUDE.md`
and `src/styles.css` actually deliver the calmer, wider feel the second
redesign pass asked for, and whether the live updates feel like a shared
room rather than a mechanical refresh.
