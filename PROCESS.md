# Process overview

The Dig is now a shared archaeological investigation. Visitors enter the same excavation site, choose a name, and get five digs per day. Digging exposes soil, brushing reveals a fragment underneath, and those fragments gradually reconstruct a forgotten personal website from the early 2000s. Players can save useful fragments, leave field notes, and submit theories about whose site they are uncovering and what it was for.

Crit 8 established persistence. Crit 9 focused on making those actions happen live for everyone currently on the site.

## Stack and real-time architecture

The project still uses Astro in server output mode with the Node adapter, Drizzle and better-sqlite3.

For Crit 9 I needed changes made by one visitor to appear for everyone else without refreshing. I kept the existing server-rendered architecture and added server-sent events instead of moving the project to a client framework or WebSockets.

An in-process event bus now broadcasts successful digs, brushes, field notes and theories to every connected visitor. The same live system also makes conflicts visible. If two people try to dig the same tile, the server keeps the existing first-write-wins rule and the second visitor gets a notification that someone else reached it first. That way the server still decides the real state of the game, while the live layer makes those changes and conflicts visible immediately.

I recorded that decision in `docs/decisions/0001-live-same-cell-race.md`, including the alternatives considered and why the server remains the source of truth.

## Making multiplayer feel visible

The first live version worked technically, but a tile silently changing was not enough to make the game feel multiplayer.

I added player-controlled names so actions belong to recognisable people. Names now appear on discoveries, notes, theories and the dig log. I also made the mystery prompt more prominent so theories feel like part of the main game rather than an extra feature ([f5db69b](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/f5db69b68bc1a23f0c47a09d4b546b38c79d0203)).

Digging, brushing, adding to the tray, posting notes and submitting theories now update in place instead of reloading the whole page. The original server-rendered paths still work as a fallback.

I also added live notifications. If another player posts a field note or theory while someone is online, they now get a pop-up notification. That made another person's presence much more obvious than simply updating content in the background.

## Correcting the interaction

Moving to in-place updates introduced problems that were not there before.

The first version flickered because replaced sections replayed their animations every time a live update arrived. Instead of feeling live, the board looked like it was constantly redrawing. I corrected that so only the actual changed item animates ([ca51929](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/ca5192904dbdd1dfecc4597d5d2fe10469205a30)).

I also changed the layout so the excavation uses more of the screen and moved the dig log into the side panel instead of letting it crowd the board ([5222ec5](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/5222ec55aebd037f4a11b827d690be6aab34d113)).

This made it clear that real-time behaviour is not only about whether data arrives quickly. It also matters whether the update is visually calm enough that people can keep using the game while changes happen around them.

## Visual iteration

A large part of this crit was also spent making the project feel more like a game.

Earlier versions looked too much like dashboards, then became too heavy and comic-like, and later looked too hand-drawn. I started using archaeology-game references and generated asset sheets so I could give the agent much more specific visual direction.

The excavation was rebuilt as one connected isometric site where depth represents state: untouched turf, excavated soil, then the revealed layer ([6834160](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/68341603d035b0cbd56f73dc59b2cdc96f32b06b)).

I then supplied generated asset sheets for tools, crates, survey equipment, flags and other props, which replaced several weaker hand-drawn elements and made the site more visually consistent ([247c6d4](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/247c6d4de694639a110618d4d3e8f3728c9e1f52)).

I still had to correct the agent visually. One example was the oval shadows it added under imported props, which made them look like they were floating. I asked for one consistent light direction and grounded contact shadows instead ([384c436](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/384c436649b25145405ebe39dc39fd8580df4a19)).

## Tests and next direction

`spec/realtime.test.ts` checks that live changes reach open SSE connections within the required time and that every connected visitor receives them. Identity also has its own test covering persistence of chosen names and visibility to other players.

The Dig now has persistent excavation, player identity, real-time updates, live notes and theories, a shared activity log, and notifications that make other visitors feel present.

The next step is to deepen the investigation rather than add unrelated features: make the specimen tray more useful as evidence, make theories lead toward an actual solution, and later use the excavation history for silting and Crit 10 observability.