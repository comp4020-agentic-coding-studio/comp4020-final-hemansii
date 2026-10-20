# Process overview

The Dig is a shared archaeological investigation. Visitors enter the same excavation site, choose a name, and get five digs per day. Digging exposes soil, brushing reveals a fragment underneath, and those fragments gradually reconstruct a forgotten website from the early 2000s. Players can save useful fragments, leave field notes, and submit theories about what site they think they are uncovering.

Crit 8 established persistence, Crit 9 made the excavation live between visitors, and Crit 10 focused on making those visitors distinguishable and making their actions observable from the server.

## Real-time architecture

The project still uses Astro in server output mode with the Node adapter, Drizzle and better-sqlite3.

For Crit 9 I needed one visitor's actions to appear for everyone else without refreshing. I kept the existing server-rendered architecture and added server-sent events rather than moving the project to a client framework or WebSockets.

An in-process event bus broadcasts digs, brushes, field notes and theories to connected visitors. If two players try to dig the same tile, the server keeps the existing first-write-wins rule and the second visitor is told that someone else got there first.

I recorded the reasoning behind this in `docs/decisions/0001-live-same-cell-race.md`.

## Making multiplayer feel visible

The first live version technically worked, but silent updates did not make the game feel multiplayer.

I added player-controlled names so actions belong to recognisable visitors. Names appear on discoveries, notes, theories and the activity log. Digging, brushing, specimen actions, notes and theories also update in place rather than reloading the page ([f5db69b](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/f5db69b68bc1a23f0c47a09d4b546b38c79d0203)).

I later added live notifications when another visitor posts a field note or theory, so another person's presence is visible even when the player is looking at a different part of the interface ([bb677b2](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/bb677b2217b83132b529697ffc04e7b39db7b875)).

## Interaction and visual iteration

Moving to in-place updates introduced problems such as flickering when replaced sections replayed their animations. I corrected that so only the changed item animates instead of the whole board redrawing ([ca51929](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/ca5192904dbdd1dfecc4597d5d2fe10469205a30)).

The visual design also continued to change. Earlier versions still felt too much like a website with a grid, so I rebuilt the excavation as one connected isometric site and used generated archaeology asset sheets for the terrain, tools and environmental props ([6834160](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/68341603d035b0cbd56f73dc59b2cdc96f32b06b), [502bac3](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/502bac3423866bde978097ea1d91cf9fdec22af7)).

I also redesigned the specimen tray so it works more like an evidence space. Players can add private notes to saved finds and cite up to three of those finds when submitting a public theory ([ccce972](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/ccce972aeaeb60593de563c5658f213502273842), [8631798](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/8631798f560fa4cb36991087b1122ae1acddab91)).

The excavation also moved from one made-up homepage to a sequence of recognisable early-2000s sites. Correctly naming a site closes it and moves the shared game onto the next excavation ([d041e68](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/d041e682611cd2757bcc3870043dc9fef22610f6)).

## Crit 10: identity, authorization and logging

Crit 10 made me look more closely at how the server distinguishes visitors.

The real identity is the visitor's cookie id. Their chosen name is only for display and is never used to decide what they are allowed to change. Shared parts of the game, such as the excavation, field notes and theories, are intentionally open to every visitor. Personal specimen trays and specimen notes are scoped to their owner and checked on the server.

I documented those rules and why they fit the game in `docs/decisions/0002-what-a-visitor-may-see-and-change.md` ([7c5cfdd](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/7c5cfdd701da698eb5d50244e40ab7a533fc9c8c)).

The other major Crit 10 change was server-side audit logging. Every state-changing action now produces a structured stdout log containing the visitor's display name, a stable hashed reference to their cookie identity, the action, its target, and whether the result was successful, rejected or a conflict ([9f99701](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/9f99701c1a003c4ac2791b1a50635b03bbd16ed4)).

This means I can watch two people use the deployed game in separate browser profiles and narrate what they are doing entirely from the Fly logs, without relying on my own UI.

## Tests and checks

The project has tests for persistence, real-time delivery, visitor identity, private specimen evidence and audit logging. The audit tests also check that the stable visitor reference does not expose the raw cookie value.

I continued checking the running application as well as the automated tests because several important problems, such as flicker, layout issues and visual inconsistencies, only became obvious in the browser.

The main change in my process across these crits has been moving from checking whether a feature technically works to checking whether its behaviour is visible, understandable and actually enforced by the server.