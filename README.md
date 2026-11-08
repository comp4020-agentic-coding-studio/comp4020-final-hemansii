# The Dig

The Dig is a shared excavation game about uncovering the early web together. Visitors receive five free digs each day, expose and brush sections of a buried site, save useful fragments to a private specimen tray, leave field notes, and build theories from evidence.

A site is not solved simply by naming it. A winning theory must name the correct site, name no competing site, and cite at least one recovered clue from that visitor's own tray. When a site is solved, it moves into History and the next one is buried.

## What good means here

Good means the excavation behaves like one shared place rather than a collection of independent browser sessions. Actions must persist and become visible to other visitors. Live sessions should see changes without reloading, while the server remains the source of truth when two people act on the same section at once. The first successful write wins. The trade-offs behind that choice are recorded in [`docs/decisions/0001-live-same-cell-race.md`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/blob/main/docs/decisions/0001-live-same-cell-race.md).

Good also means that solving requires participating in the excavation. The specimen tray is not only a collection screen: it supplies the evidence needed to solve a site. This prevents a visitor from bypassing the game by listing every possible answer in one theory.

The course's C5 *A game* brief argues that a game should teach itself through play without on-screen instructions. I followed that idea in the tile states: buried sections invite digging, dusty sections show a brush cue, revealed clues can be saved, and saved finds gain a visible tick. I did not follow the rule completely. When friends tested the phone version, it was not obvious that a dug section needed a second tap, so I kept a small `dig -> brush -> save` strip. It marks each step as learned and folds down once all three have been completed.

The final experience should also communicate its state clearly. Players can see who else is present, when the live connection drops, what happened while they were away, when free digs return, and who contributed clues to a solved site. Personal evidence stays private to the visitor who saved it, while shared notes and theories remain public. That boundary is documented in [`docs/decisions/0002-what-a-visitor-may-see-and-change.md`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-hemansii/blob/main/docs/decisions/0002-what-a-visitor-may-see-and-change.md).

## What is enforced

The checks in `spec/` cover rules that can be made objective:

- digs and brushes persist;
- each visitor receives the correct daily dig allowance;
- unrevealed content does not leak before brushing;
- real-time dig updates reach other open sessions;
- visitor identity and private specimen ownership are enforced server-side;
- audit logs do not expose the raw visitor cookie;
- solving requires valid evidence and rejects the all-five-names shortcut;
- free digs reset on the Canberra/Sydney day boundary;
- solved-site history credits contributors.

`scripts/stress.ts` separately exercises concurrency and bonus-dig purchasing, including many visitors racing for the same section and a 20-player simultaneous solve that must still produce exactly one winner.

## What is judged

Some claims cannot be reduced to tests: whether the excavation reads as one illustrated place, whether digging and brushing feel different from generic buttons, and whether the phone version works as its own layout. I judged those through repeated browser checks at 1920×1080 and 390×844 after interface changes, alongside feedback from friends testing the mobile interaction.

## Limits and trade-offs

The deployment uses one Fly machine with one persistent SQLite volume.

A visitor's identity lives in that browser's cookie, so there is no cross-device account system. There are five buried sites; after all five have appeared, the sequence can repeat. Untouched sections do not silt over time.

## Sources

- COMP4020/8020 Agentic Coding Studio, C5: *A game*. Used as a reference for teaching interaction through play.
- Two Hergé *Tintin* cover images for ligne claire: flat colour, confident linework and poster-like composition.