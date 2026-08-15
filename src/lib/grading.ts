import type { Question } from "../data/types";

/** Lowercase, trim, collapse whitespace, and strip trailing punctuation for forgiving comparisons. */
export function normalizeAnswer(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,!?'"]+$/g, "");
}

/**
 * Grades a submitted answer against a question. `submitted` is either free
 * text (recall questions without choices) or the exact string of a selected
 * choice/maneuver/point-of-sail option.
 */
export function isCorrect(question: Question, submitted: string): boolean {
  if (question.type === "recall" && !question.choices) {
    const accepted = [question.answer, ...(question.acceptableAnswers ?? [])].map(normalizeAnswer);
    return accepted.includes(normalizeAnswer(submitted));
  }
  return normalizeAnswer(submitted) === normalizeAnswer(question.answer);
}
