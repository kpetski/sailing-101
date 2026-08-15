import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { QUESTIONS } from "../data/questions";
import { TOPIC_MAP } from "../data/topics";
import { POINT_OF_SAIL_CHOICES, type Question, type TopicId } from "../data/types";
import PointsOfSailDiagram, {
  MANEUVER_LABELS,
  type Maneuver,
} from "../components/PointsOfSailDiagram";
import LabelDiagram from "../components/LabelDiagram";
import { isCorrect, normalizeAnswer } from "../lib/grading";
import { shuffle } from "../lib/shuffle";
import { useQuizProgress } from "../hooks/useQuizProgress";
import styles from "./Quiz.module.css";

const MANEUVER_OPTIONS = Object.keys(MANEUVER_LABELS) as Maneuver[];

interface SessionResult {
  topic: TopicId;
  correct: boolean;
}

export default function Quiz() {
  const [searchParams] = useSearchParams();
  const topicParam = searchParams.get("topic");
  const isMissedMode = searchParams.get("mode") === "missed";
  const { progress, recordAnswer } = useQuizProgress();

  // Snapshot the missed-id set once, at mount, so the list doesn't shift under the user mid-quiz.
  const [missedIdsAtStart] = useState(() => new Set(progress.missed));

  const [questions, setQuestions] = useState<Question[]>(() => {
    const pool = isMissedMode
      ? QUESTIONS.filter((q) => missedIdsAtStart.has(q.id))
      : topicParam && topicParam !== "all"
        ? QUESTIONS.filter((q) => q.topic === topicParam)
        : QUESTIONS;
    return shuffle(pool);
  });

  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [textValue, setTextValue] = useState("");
  const [wasCorrect, setWasCorrect] = useState(false);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [finished, setFinished] = useState(false);

  const question = questions[index];

  const choices = useMemo(() => {
    if (!question) return [];
    if (question.type === "recall" && question.choices) return question.choices;
    if (question.type === "pointOfSail") return [...POINT_OF_SAIL_CHOICES];
    return [];
  }, [question]);

  if (questions.length === 0) {
    return (
      <div className="container">
        <h1>Nothing to quiz here yet</h1>
        <p>
          {isMissedMode
            ? "No missed questions right now — nice work."
            : "This topic doesn't have any questions yet."}
        </p>
        <Link className="btn btn-primary" to="/">
          Back home
        </Link>
      </div>
    );
  }

  function grade(value: string) {
    if (!question || submitted) return;
    const correct = isCorrect(question, value);
    setSelected(value);
    setSubmitted(true);
    setWasCorrect(correct);
    recordAnswer(question, correct);
    setSessionResults((prev) => [...prev, { topic: question.topic, correct }]);
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!textValue.trim()) return;
    grade(textValue);
  }

  function next() {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSubmitted(false);
    setSelected("");
    setTextValue("");
    setWasCorrect(false);
  }

  function retake() {
    setQuestions((qs) => shuffle(qs));
    setIndex(0);
    setSubmitted(false);
    setSelected("");
    setTextValue("");
    setWasCorrect(false);
    setSessionResults([]);
    setFinished(false);
  }

  if (finished) {
    const total = sessionResults.length;
    const correctCount = sessionResults.filter((r) => r.correct).length;
    const byTopic = new Map<TopicId, { correct: number; total: number }>();
    for (const r of sessionResults) {
      const cur = byTopic.get(r.topic) ?? { correct: 0, total: 0 };
      cur.total += 1;
      if (r.correct) cur.correct += 1;
      byTopic.set(r.topic, cur);
    }

    return (
      <div className="container">
        <h1>Results</h1>
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "var(--deep)", marginBottom: 10 }}>
            {correctCount} / {total} correct ({total > 0 ? Math.round((correctCount / total) * 100) : 0}%)
          </div>
          {[...byTopic.entries()].map(([topicId, stats]) => (
            <div className={styles.summaryRow} key={topicId}>
              <span>{TOPIC_MAP[topicId].title}</span>
              <span>
                {stats.correct} / {stats.total}
              </span>
            </div>
          ))}
        </div>
        <div className={styles.actions}>
          <button className="btn btn-primary" onClick={retake}>
            Retake this quiz
          </button>
          <Link className="btn" to="/">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.progressLine}>
        <span>{TOPIC_MAP[question.topic].title}</span>
        <span>
          {index + 1} / {questions.length}
        </span>
      </div>

      {(question.type === "maneuver" || question.type === "pointOfSail") && (
        <div className={styles.diagramWrap}>
          <PointsOfSailDiagram
            boats={question.boats}
            turnArc={question.type === "maneuver" ? question.turnArc : undefined}
            obstacleAt={question.type === "maneuver" ? question.obstacleAt : undefined}
            targetAt={question.type === "maneuver" ? question.targetAt : undefined}
          />
        </div>
      )}

      {question.type === "label" && (
        <div className={styles.diagramWrap}>
          <LabelDiagram variant={question.variant} points={question.points} activeId={question.activeId} />
        </div>
      )}

      <div className={`card`}>
        <div className={styles.prompt}>{question.prompt}</div>

        {question.type === "maneuver" && (
          <div className={styles.maneuverGrid}>
            {MANEUVER_OPTIONS.map((m) => {
              const label = MANEUVER_LABELS[m];
              const isChosen = submitted && selected === label;
              const isAnswer = submitted && normalizeAnswer(question.answer) === normalizeAnswer(label);
              const cls = !submitted
                ? styles.choiceBtn
                : isAnswer
                  ? `${styles.choiceBtn} ${styles.correct}`
                  : isChosen
                    ? `${styles.choiceBtn} ${styles.incorrect}`
                    : styles.choiceBtn;
              return (
                <button key={m} className={cls} disabled={submitted} onClick={() => grade(label)}>
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {(question.type === "pointOfSail" || (question.type === "recall" && question.choices)) && (
          <div className={styles.choices}>
            {choices.map((choice) => {
              const isChosen = submitted && selected === choice;
              const isAnswer = submitted && normalizeAnswer(question.answer) === normalizeAnswer(choice);
              const cls = !submitted
                ? styles.choiceBtn
                : isAnswer
                  ? `${styles.choiceBtn} ${styles.correct}`
                  : isChosen
                    ? `${styles.choiceBtn} ${styles.incorrect}`
                    : styles.choiceBtn;
              return (
                <button key={choice} className={cls} disabled={submitted} onClick={() => grade(choice)}>
                  {choice}
                </button>
              );
            })}
          </div>
        )}

        {((question.type === "recall" && !question.choices) || question.type === "label") && (
          <form className={styles.textForm} onSubmit={handleTextSubmit}>
            <input
              className={styles.textInput}
              type="text"
              placeholder="Type your answer…"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              disabled={submitted}
              autoFocus
            />
            <button className="btn btn-primary" type="submit" disabled={submitted || !textValue.trim()}>
              Check
            </button>
          </form>
        )}

        {submitted && (
          <div className={`${styles.feedback} ${wasCorrect ? styles.correct : styles.incorrect}`}>
            <div className={styles.feedbackTitle}>{wasCorrect ? "Correct!" : "Not quite."}</div>
            {!wasCorrect && (
              <div>
                Correct answer:{" "}
                <b>
                  {question.type === "maneuver" ? MANEUVER_LABELS[question.answer as Maneuver] : question.answer}
                </b>
              </div>
            )}
            {"why" in question && question.why && <div style={{ marginTop: 6 }}>{question.why}</div>}
          </div>
        )}

        {submitted && (
          <button className="btn btn-primary btn-block" onClick={next}>
            {index + 1 >= questions.length ? "See results" : "Next question"}
          </button>
        )}
      </div>
    </div>
  );
}
