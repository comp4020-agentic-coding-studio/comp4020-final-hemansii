# Crit 8: It's alive!

**What was the breakthrough that moved the work forward?**

Writing the plan down before touching any file, twice, for what looked
like "just" a CSS redesign. I went in assuming a restyle was low-stakes
enough to just start editing, but the first pass alone touched the whole
stylesheet, every page, and four new decorative components, and most of
the real decisions in it (what to keep from the comic-panel look, what a
"continuous ground" tile should mean, how far to soften the font) were
subjective enough that I'd have re-litigated them three times over if I'd
just started typing CSS. Stating the trade-offs once, up front, specifically
not touching the data model or the no-JS animation technique even where
a richer version of the brief would have wanted it, is what kept two
separate large passes from drifting into a rewrite I didn't have time to
re-test properly. The other half of it was not trusting a diff: a CSS bug
from the first pass survived into the second because deleting one rule
that produced a visual effect wasn't the same as removing the effect, and
I only caught that by looking at the actual rendered grid.

**What did this work change about who I want to be as a software developer?**

I want to be someone who treats "it looks right in the diff" as a weaker
claim than "I looked at the running thing," especially under time
pressure, where skipping that check is exactly the corner that's tempting
to cut. I also want to keep reaching for a written plan earlier than my
instinct says a task warrants it, because the tasks where it felt
unnecessary were the ones where it saved the most rework.
