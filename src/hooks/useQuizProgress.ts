import type { Question } from "../data/types";
import type { TopicId } from "../data/types";
import { useLocalStorage } from "./useLocalStorage";

export interface TopicStats {
  correct: number;
  attempted: number;
}

export interface QuizProgress {
  scores: Partial<Record<TopicId, TopicStats>>;
  /** Question ids currently missed — cleared once answered correctly again. */
  missed: string[];
}

const STORAGE_KEY = "sailing101-progress-v1";
const EMPTY_PROGRESS: QuizProgress = { scores: {}, missed: [] };

/** Tracks per-topic quiz scores and a "missed questions" set, persisted to localStorage. */
export function useQuizProgress() {
  const [progress, setProgress] = useLocalStorage<QuizProgress>(STORAGE_KEY, EMPTY_PROGRESS);

  function recordAnswer(question: Question, correct: boolean) {
    setProgress((prev) => {
      const stats = prev.scores[question.topic] ?? { correct: 0, attempted: 0 };
      const nextStats: TopicStats = {
        correct: stats.correct + (correct ? 1 : 0),
        attempted: stats.attempted + 1,
      };
      const missedSet = new Set(prev.missed);
      if (correct) {
        missedSet.delete(question.id);
      } else {
        missedSet.add(question.id);
      }
      return {
        scores: { ...prev.scores, [question.topic]: nextStats },
        missed: Array.from(missedSet),
      };
    });
  }

  function resetProgress() {
    setProgress(EMPTY_PROGRESS);
  }

  return { progress, recordAnswer, resetProgress };
}
