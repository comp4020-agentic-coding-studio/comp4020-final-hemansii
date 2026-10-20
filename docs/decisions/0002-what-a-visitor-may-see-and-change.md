# 2. What a visitor may see and change

## Context

Crit 10 asks the app to tell two or more people apart and to have the server,
not the client, decide what each of them may see and change. The Dig already
had an identity (the `digger` cookie, `src/lib/visitor.ts`) and a shared
grid, but the rule for who can touch what was implicit in the code rather
than written down anywhere. This records what's actually enforced, and why.

## Identity: the cookie is who you are, the name is just a label

`getOrCreateVisitor` (`src/lib/visitor.ts:21`) reads a random 16-byte id from
the `digger` cookie, creating one on first visit. Every write in the app
(`dig`, `brush`, `postNote`, `postTheory`, `addToTray`, `setSpecimenNote`,
`setName`, in `src/lib/dig.ts`, `src/lib/notes.ts`, `src/lib/theories.ts`,
`src/lib/specimens.ts`) takes that `visitorId`, never a name, and every API
route (`src/pages/api/*.ts`) reads it straight from the cookie via
`getOrCreateVisitor(cookies)`, never from form input. A request can send
whatever cell, body or evidence it likes; it can never claim to be a
different visitor.

The display name (`visitors.name`, changed with `setName`) is presentation
only. It's what shows next to a dig, note or theory (`src/lib/activity.ts`,
`src/lib/notes.ts`, `src/lib/theories.ts` all join on `visitors.name` for
display), but nothing is ever looked up or authorised by it. Two visitors
could pick the same name and the server would still tell them apart
correctly, because every check underneath is keyed on the cookie id.

## Shared state: the excavation, field notes and theories

The dig grid, the field notes feed and the theories feed are the shared
investigation; anyone's writes to them are visible to everyone.

- **Digging** (`dig()`, `src/lib/dig.ts:105`): any visitor can dig any
  available tile, up to `DIGS_PER_DAY` (5) per Canberra calendar day,
  enforced by `digsToday()` inside the same transaction as the write, not by
  hiding the button for a visitor who's used their digs (the disabled
  attribute in `src/pages/index.astro:180` is a UI convenience; the server
  check is what actually stops a 6th dig posted directly).
- **Brushing** (`brush()`, `src/lib/dig.ts:130`): deliberately open to any
  visitor, not just whoever dug the tile. This is the collaborative step:
  finishing what a stranger started is part of what crit 8 asked to persist
  (see `spec/persistence.test.ts`), so brushing has no owner check at all.
- **Notes and theories** (`postNote`, `postTheory`): any visitor can post
  one; there's no edit or delete path for either, so there's nothing to
  restrict there beyond who's allowed to post, which is everyone.
- **Conflicts are resolved server-side, not by the client.** Two visitors
  racing for the same cell both get a transaction that checks and writes
  atomically (`db.transaction` in `dig()` and `brush()`); the loser gets
  `already-dug` or `already-brushed` back, the same decision that was already
  in place before real-time existed (`docs/decisions/0001-live-same-cell-race.md`).
  A theory that names the site while another has just closed it loses the
  same way (the `open?.closedAt` recheck inside `postTheory`'s transaction,
  `src/lib/theories.ts:43`).

## Private state: a visitor's own specimen tray

A visitor's specimen tray, and the note they write on each specimen in it,
are the one part of the app that is not shared:

- `trayFor(visitorId, siteId)` (`src/lib/specimens.ts:57`) only ever reads
  rows where `specimens.visitorId` matches the caller; nothing renders
  another visitor's tray.
- `addToTray`, `removeFromTray` and `setSpecimenNote` all filter through the
  `mine()` helper (`src/lib/specimens.ts:82`), which requires
  `specimens.visitorId = visitorId` on top of the site and cell. Because
  `visitorId` always comes from the cookie (never the request body), one
  visitor's POST to `/api/specimen-note` or `/api/archive` can only ever
  touch rows keyed to their own id. `setSpecimenNote` returns `false` when
  the row doesn't match, which `/api/specimen-note` reports back as
  `archive-bad-cell`; `spec/evidence.test.ts` checks this directly, that a
  stranger can't note a find that isn't in their own tray and that a
  specimen note never appears in another visitor's page or archive HTML.
- A theory can only cite evidence from the poster's own tray: `postTheory`
  (`src/lib/theories.ts:21`) builds `inTray` from `specimens` rows filtered
  to `visitorId`, and drops any cited key not in that set, so a theory can't
  smuggle in evidence for a section the poster never brushed (which would
  otherwise leak that section's content to the shared theories feed before
  anyone else had earned it).

## Why this model, not something finer-grained

The Dig has one kind of visitor, not roles: there's no moderator, no owner of
a tile, no one who can edit someone else's note. Everything that represents
the shared excavation (the grid, notes, theories) is writable by any
visitor, because the point of the game is a crowd uncovering one site
together; the daily dig cap is the only throttle on that, and it exists to
pace discovery, not to gate who's allowed to participate. The one thing that
is personal, the tray and its notes, exists so a visitor can work out their
own theory before posting it, and sharing it would mean reading someone
else's half-formed guess, which is specifically what `spec/evidence.test.ts`
rules out.

All of this is checked inside the functions in `src/lib/`, not in the Astro
pages or client-side script, and never trusts a value a request can forge
(cell, visitor id, evidence keys) over what the cookie and the database
already say. The client's disabled buttons and hidden forms are there for
feel, not enforcement; every one of them has a server-side check behind it
that holds even if a request skips the UI entirely, which is exactly the
shape crit 10 tests at the live session.
