import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { today } from "./dig";
import { db } from "./db";
import { triviaAnswers, visitors } from "./schema";
import { TRIVIA_BANK, type TriviaQuestion } from "./trivia-bank";

export const TRIVIA_REWARD = 5;
// Paid on top of TRIVIA_REWARD for an nth consecutive correct day, capped so
// it never dwarfs the one-off reward for actually solving a site.
const STREAK_CAP = 10;

// Same question for everyone on a given Canberra day, chosen deterministically
// from the date so there's nothing to store: day N always maps to the same
// bank entry.
export function questionFor(day = today()): TriviaQuestion {
  const hash = createHash("sha256").update(day).digest();
  return TRIVIA_BANK[hash[0] % TRIVIA_BANK.length];
}

export type TriviaStatus = { answeredToday: boolean; correct: boolean | null; streak: number };

export function triviaStatus(visitorId: string): TriviaStatus {
  const day = today();
  const visitor = db.select({ streak: visitors.triviaStreak }).from(visitors).where(eq(visitors.id, visitorId)).get();
  const attempt = db
    .select({ correct: triviaAnswers.correct })
    .from(triviaAnswers)
    .where(and(eq(triviaAnswers.visitorId, visitorId), eq(triviaAnswers.day, day)))
    .get();
  return { answeredToday: !!attempt, correct: attempt?.correct ?? null, streak: visitor?.streak ?? 0 };
}

export type TriviaResult = "correct" | "wrong" | "already-answered";

// One attempt per visitor per day (trivia_answers_unique). A correct answer
// pays TRIVIA_REWARD plus a growing streak bonus for consecutive correct
// days; a wrong answer, or a second day missed, resets the streak to 0.
export function answerTrivia(visitorId: string, choice: number): TriviaResult {
  const day = today();
  return db.transaction((tx) => {
    const dup = tx
      .select({ id: triviaAnswers.id })
      .from(triviaAnswers)
      .where(and(eq(triviaAnswers.visitorId, visitorId), eq(triviaAnswers.day, day)))
      .get();
    if (dup) return "already-answered";

    const visitor = tx
      .select({ streak: visitors.triviaStreak, lastDay: visitors.lastTriviaDay })
      .from(visitors)
      .where(eq(visitors.id, visitorId))
      .get();
    const correct = choice === questionFor(day).answer;
    tx.insert(triviaAnswers).values({ visitorId, day, correct }).run();

    if (!correct) {
      tx.update(visitors).set({ triviaStreak: 0 }).where(eq(visitors.id, visitorId)).run();
      return "wrong";
    }

    const yesterday = today(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const continuing = visitor?.lastDay === yesterday;
    const streak = continuing ? (visitor?.streak ?? 0) + 1 : 1;
    const bonus = Math.min(streak - 1, STREAK_CAP);
    tx.update(visitors)
      .set({ shards: sql`${visitors.shards} + ${TRIVIA_REWARD + bonus}`, triviaStreak: streak, lastTriviaDay: day })
      .where(eq(visitors.id, visitorId))
      .run();
    return "correct";
  });
}
