# Crit 10: Fly by instruments

## What was the breakthrough that moved the work forward?

The breakthrough was realising that “tell people apart” and “log who did what” were really connected problems. The Dig already had an identity for each visitor through their cookie and chosen display name, but that identity was only visible inside the game.

Once I added one audit helper and used it across every state-changing action, the activity became visible from the server logs as well. Each line shows who acted, what they did, what they acted on, and whether it succeeded, was rejected, or lost a race to another player. That made it possible to watch two people use the site and understand what was happening without looking at the UI.

The other breakthrough was realising that the authorization model was mostly already there, but I had never properly documented it. Writing the decision record made me check the actual code instead of assuming the rules were being enforced correctly, especially around private specimen data and shared excavation actions.

## What did this work change about who I want to be as a software developer?

It made me more careful about the difference between something working locally and actually being ready in production.

I tested the audit logs locally and initially thought the feature was done, then realised the latest commits had not been pushed and the deployed Fly app was still running the old version. Checking the real deployed environment with separate visitor sessions caught that before the crit. I want to keep getting better at verifying the system people will actually use, not just the version running on my machine.