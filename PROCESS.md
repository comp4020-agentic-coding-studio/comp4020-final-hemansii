# Process overview

The Dig started as a much smaller idea than the version that exists now. The first concept was a shared archaeology site where visitors excavated tiles and occasionally uncovered artefacts. For Crit 8, the main requirement was persistence, so the first question was what one action would leave a trace that another visitor could come back and see.

That led to the first core loop: each visitor gets five digs per day, chooses a tile, and whatever they uncover stays excavated for everyone else. I also stored the time of each dig because I wanted the site to eventually “silt up”, where areas nobody touches slowly become buried again. I did not build the silting behaviour yet, but keeping timestamps now leaves room for it later.

The concept changed while I was working. Random artefacts started to feel too disconnected, so I changed the site into an excavation of one larger buried object: a forgotten early-2000s personal website. That gave the digging more purpose because each tile became part of a larger mystery. The visitor is not just collecting objects, they are gradually reconstructing something with everyone else.

From there I added features that supported that idea. Revealed fragments can be collected in a specimen tray. Visitors can leave field notes suggesting where somebody should dig next, and theories let people guess what the buried site used to be. The project became closer to a collaborative investigation than the original “click a tile and get an artefact” prototype.

## Stack and why

The project keeps the stack carried forward from Crit 7 ([df2614b](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/df2614b)): Astro in server output mode with the Node adapter, Drizzle and better-sqlite3.

I kept this because the core interactions fit server-rendered forms well. Digging, brushing, posting notes and posting theories can all be handled as a POST followed by a redirect. That keeps the important persistence behaviour simple and means the main flow does not depend on a client framework. The main exception is the specimen tray drag-and-drop interaction, which needs a small amount of client JavaScript.

I deliberately did not redesign the data model every time the interface changed. Once persistence, daily dig limits and revealed fragments were working, I treated those as stable rules and iterated around them instead. That let me experiment heavily with the experience without repeatedly breaking the part Crit 8 actually depends on.

## Building the interaction

One of the biggest changes was realising that clicking a grid cell was not enough to make the site feel like an excavation. I wanted the action itself to feel physical. I added separate buried, dusty and revealed states, then made digging and brushing visually different. A dig produces dirt movement, while brushing reveals what is underneath. The grid also gained coordinates so visitors can refer to places such as “C7” in field notes.

I also pushed the site toward more tactile interactions. The specimen tray became something visitors could drag recovered fragments into instead of only being a number in the header. That exposed an important issue: the tray count was changing, but the tray itself was not showing the collected items, so the interaction looked broken even though the backend state had changed. Fixing that made me think more carefully about the difference between a feature technically happening and the user actually seeing the result.

A similar problem appeared with navigation. Digging and brushing worked, but each server-rendered action caused the page to visibly jump. I corrected the redirect targets and scrolling behaviour so the visitor returns to the tile they just interacted with instead of feeling like the page reset ([a7a4924](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/a7a4924877f3d499c441e4729b4e61a8c37bfc10)).

## Visual direction and iteration

The visual design took the most iteration because I was not happy with the first versions. The site initially looked like a centred dashboard with a dark grid and several cards beside it. It technically contained everything, but it did not feel like a place.

I experimented with generated archaeology assets and more game-like graphics, but they kept looking either too childish, too much like a mobile game, or too disconnected from the rest of the page. I eventually stopped treating the problem as “find better icons” and started treating it as a complete art direction problem.

I used ligne claire adventure-comic references as a visual direction and asked the agent to redesign the whole interface around that rather than reskin individual buttons. The first pass pushed too far into heavy black outlines, chunky display type and comic-panel styling ([1646334](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/16463340e2a7275a68d005c38ee34de0aaeb19af)). I still did not like the balance, especially the narrow layout and the way the excavation board competed with the side panels.

The next pass was much more specific. I asked for a wider editorial layout where the excavation itself dominates the screen, with more restrained typography, fewer heavy borders, soil-toned seams, physical expedition props and the side content consolidated into a cleaner panel. That became the stronger direction ([545d35b](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/545d35bbae43a4860d18c726a135a8a86467e236)).

That process showed me that “make it look better” is not a useful instruction to an agent. The better results came when I could explain what felt wrong: too centred, too much unused space, the wrong typography, tiles that looked like spreadsheet cells, or props that felt pasted on instead of belonging to one scene.

## Corrections and checks

The redesign also produced visual bugs. One grass effect was being drawn in two different CSS layers, so removing one rule did not actually remove the visible band. I only caught that by looking at the rendered page and tracing the remaining colour references. That reinforced a pattern from the rest of the project: browser checks matter because a green test suite cannot tell me whether the experience looks or feels wrong.

`CLAUDE.md` carries the standing style rule that shipped text should not use em dashes ([d836899](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/commit/d836899)). I kept the file intentionally small so it contains rules that genuinely need to persist between sessions rather than duplicating documentation already present elsewhere.

## What comes next

Crit 8 establishes the shared persistent excavation. The next steps are the parts that make that shared world feel more alive: real-time activity, stronger collaboration around notes and theories, the silting system, and eventually multiple buried sites that can move into an archive once the community has reconstructed them.

The biggest change in my process this crit was moving from asking the agent to add features toward repeatedly judging whether those features actually supported the central idea. The project became stronger once each decision was tied back to one question: does this make the site feel more like a shared excavation people can return to?