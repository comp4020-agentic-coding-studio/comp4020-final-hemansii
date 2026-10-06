# Process overview

The Dig is a browser-based excavation game: a shared archaeological site
rendered as a grid of buried, dusty and revealed tiles. Visitors get a
capped number of digs a day, brush what they dig up to reveal a fragment
of an old personal homepage underneath, collect fragments in a specimen
tray, and leave field notes and theories with other visitors about what
the site used to be.

## Stack and why

The stack is the one carried forward from crit 7
([df2614b](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/df2614b)):
Astro in server output mode with the Node adapter, Drizzle over
better-sqlite3, no client framework. The reasoning that carried over: the
whole interaction loop (dig, brush, archive, notes, theories) is a form
POST followed by a redirect, so a server-rendered page with no client
JavaScript for the core loop is a better fit than an SPA. It also means
the test suite can drive the app as a plain HTTP client
(`spec/visitor.ts`'s `TestVisitor`), which is cheaper to write and faster
to run than a browser-automation suite would be, at the cost of losing
optimistic UI updates on dig and brush. The one deliberate exception is
the specimen tray's drag-and-drop, which needs a `dragstart`/`drop`
listener and a `fetch` call; everything else, including every animation
in the redesign below, stays CSS-only, driven off the URL fragment
(`:target`) that the redirect already lands on.

## This crit: a visual and layout redesign, twice

Crit 8 was a request to restyle the whole site from a working but plain
prototype into something that reads as one illustrated world, done in two
passes grounded in reference material I was given mid-session (two Hergé
Tintin covers) and then a second, more specific brief asking for a wider,
calmer, more editorial version of the same idea.

Both passes went through plan mode before any file changed, which was the
right call here and wouldn't have been for a backend change: the ask
touched ten-plus files at once (styles, every page, new decorative
components) and most of the decisions were subjective and hard to
unwind cheaply once typed into CSS (a font pairing, a grid gutter model,
how many new illustrated components to add). Writing the plan down first
meant the trade-offs got stated once, instead of drifting file-by-file as
each one got touched.

The concrete trade-off I kept making explicit in both plans: don't touch
the data model, the API routes, or the no-JS `:target` animation
technique, even though the brief's language ("buried objects uncovered
piece by piece", "reduce dead space") would have been satisfied just as
well, maybe better, by adding a real multi-step reveal to the schema or a
client-side tab controller. Both would have meant re-deriving the
persistence, dig-limit and no-spoilers specs from scratch under time
pressure, for a gain that's cosmetic (the three-state buried/dusty/
revealed progression already maps onto "surface, then soil, then find";
it just needed to look like it). The second pass's tabbed side panel is
the sharpest example: it's CSS-only (a `:checked ~` selector off hidden
radio inputs), specifically so it didn't need a new interaction contract
or a script the no-JS suite would need to account for.

That restraint still produced one real bug, which is the one case this
crit actually changed a rule rather than just following one. The first
redesign pass drew the "buried" tile's grass band as a `linear-gradient`
layer baked into `button.cell`'s own `background`, so every tile painted
its own strip. The second pass added a single shared grass line meant to
replace it, but only deleted the `::before` rule that had *also* been
drawing a copy of it, not the gradient layer sitting underneath, so the
old per-tile band kept rendering, now invisible against plain tiles but
glaringly green wherever a `hue-rotate` filter (added in the same pass,
for per-tile soil variation) happened to land on it. It only surfaced
because I checked the actual rendered grid in a browser rather than
trusting that removing the `::before` rule removed the effect; grepping
the stylesheet for every remaining reference to the colour token
(`--foliage`) is what actually found the second, independent cause
([545d35b](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/545d35b)).
The lesson that's now load-bearing rather than just learned once: a visual
regression from "I deleted the rule" needs the rendered page checked, not
the diff, because the same visual effect can be produced by more than one
rule at once.

## Harness

`CLAUDE.md` carries one standing style rule (no em dashes anywhere
shipped, including commit messages and this file) added early
([d836899](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/d836899))
once it became clear it needed saying more than once per session rather
than corrected after the fact each time. It is intentionally thin outside
that: the file says explicitly that the template boilerplate isn't
recorded there because `fly.toml`, the `Dockerfile`, the CI workflow and
`spec/README.md` each already say what they fix, and repeating it in
`CLAUDE.md` would just be a second place for it to drift out of date.

## What's next

Two process-evidence gaps are still open at the time of this deploy:
`reflections/crit-8.md` and this file were both written the same evening
the redesign landed, under the cutoff, rather than kept current across
the crit the way the brief asks. The honest account of that is logged in
the reflection rather than papered over here.
