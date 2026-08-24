import { useRef, useState } from "react";
import { shuffle } from "../lib/shuffle";
import { windwardOf, headingName, REAL_POINTS, applyHeadingMove } from "../lib/boatMath";
import BoatDiagram from "./BoatDiagram";

/**
 * Steer-to-the-target practice: unlike Maneuver Practice (drag the telltale
 * straight to where it should end up), here the telltale only ever reflects
 * where the boat actually is. You get there by making one real move at a
 * time — drag the tiller, move the crew dot to the new rail when you're
 * crossing tacks, then lock the move in — until you think you've reached
 * the goal, then check.
 */

interface Scenario {
  id: string;
  startHeading: number;
  targetHeading: number;
}

// Every ordered start/target pair among the 6 real points of sail — every
// place you could plausibly be asked to navigate from and to, not a random
// sample of them (30 total: 6 starting points × 5 possible goals each).
const ALL_SCENARIOS: Scenario[] = REAL_POINTS.flatMap((start) =>
  REAL_POINTS.filter((target) => target !== start).map((target) => ({
    id: `${start}-${target}`,
    startHeading: start,
    targetHeading: target,
  }))
);

export default function NavigatePractice() {
  const [questions, setQuestions] = useState<Scenario[]>(() => shuffle(ALL_SCENARIOS));
  const [index, setIndex] = useState(0);
  const scenario = questions[index];
  const [currentHeading, setCurrentHeading] = useState(scenario.startHeading);
  const [tillerSide, setTillerSide] = useState<-1 | 0 | 1>(0);
  const [crewSide, setCrewSide] = useState<-1 | 0 | 1>(() => windwardOf(scenario.startHeading));
  const [moveLog, setMoveLog] = useState<string[]>([]);
  // Snapshot taken right before each locked-in move, so a mis-click can be undone.
  const [history, setHistory] = useState<{ heading: number; crewSide: -1 | 0 | 1 }[]>([]);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [missedIds, setMissedIds] = useState<Set<string>>(new Set());

  // A jibe has a real sequence: steady with the tiller centered, move the
  // crew to the new rail, *then* push the tiller across. A tack is
  // simultaneous in practice (you push and cross together), so it's never
  // ordered — just both need to be on the new side. These three ticks track
  // *when* (in action order, not real time) the tiller was last centered,
  // the crew last actually changed sides, and the tiller was last pushed to
  // a side — reset after every locked-in move so evidence from an earlier
  // move doesn't carry over.
  const actionSeq = useRef(0);
  const [tillerCenterTick, setTillerCenterTick] = useState(0);
  const [crewMoveTick, setCrewMoveTick] = useState(0);
  const [tillerPushTick, setTillerPushTick] = useState(0);

  const isCorrect = currentHeading === scenario.targetHeading;

  function resetSequenceTicks() {
    setTillerCenterTick(0);
    setCrewMoveTick(0);
    setTillerPushTick(0);
  }

  function handleCrewSideChange(side: -1 | 1) {
    if (side !== crewSide) {
      actionSeq.current += 1;
      setCrewMoveTick(actionSeq.current);
    }
    setCrewSide(side);
  }

  function handleTillerSideChange(side: -1 | 0 | 1) {
    if (side !== tillerSide) {
      actionSeq.current += 1;
      if (side === 0) setTillerCenterTick(actionSeq.current);
      else setTillerPushTick(actionSeq.current);
    }
    setTillerSide(side);
  }

  function lockInMove() {
    if (tillerSide === 0 || submitted) return;
    const windwardNow = windwardOf(currentHeading);
    const crossing = crewSide !== windwardNow;
    if (crossing && Math.abs(currentHeading) === 135) {
      if (crewMoveTick <= tillerCenterTick) {
        setMoveError("For a jibe, center the tiller first — steady on the reach — then move the crew to the new rail.");
        return;
      }
      if (tillerPushTick <= crewMoveTick) {
        setMoveError("For a jibe, first center the tiller on a broad reach, move the crew to the new rail, then push the tiller.");
        return;
      }
    }
    const result = applyHeadingMove(currentHeading, tillerSide, crewSide);
    if (!result.ok) {
      setMoveError(result.error);
      return;
    }
    setHistory((h) => [...h, { heading: currentHeading, crewSide }]);
    setCurrentHeading(result.newHeading);
    setMoveLog((log) => [...log, result.label]);
    // Leave the tiller where it is rather than snapping back to center —
    // holding it over is how you'd actually chain several same-direction
    // steps (e.g. heading up twice in a row). It only centers at Check, once
    // you're steady on the final course — or whenever you drag it back
    // yourself to steady up before starting a new maneuver.
    setMoveError(null);
    resetSequenceTicks();
  }

  function undoLastMove() {
    if (submitted || history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrentHeading(prev.heading);
    setCrewSide(prev.crewSide);
    setMoveLog((log) => log.slice(0, -1));
    setTillerSide(0);
    setMoveError(null);
    resetSequenceTicks();
  }

  function resetQuestion() {
    setCurrentHeading(scenario.startHeading);
    setTillerSide(0);
    setCrewSide(windwardOf(scenario.startHeading));
    setMoveLog([]);
    setHistory([]);
    setMoveError(null);
    resetSequenceTicks();
  }

  function check() {
    if (submitted) return;
    setSubmitted(true);
    setTillerSide(0);
    if (isCorrect) setCorrectCount((n) => n + 1);
    setMissedIds((prev) => {
      const next = new Set(prev);
      if (isCorrect) next.delete(scenario.id);
      else next.add(scenario.id);
      return next;
    });
  }

  function loadQuestion(s: Scenario) {
    setCurrentHeading(s.startHeading);
    setTillerSide(0);
    setCrewSide(windwardOf(s.startHeading));
    setMoveLog([]);
    setHistory([]);
    setMoveError(null);
    setSubmitted(false);
    resetSequenceTicks();
  }

  function startRound() {
    const fresh = shuffle(ALL_SCENARIOS);
    setQuestions(fresh);
    setIndex(0);
    setCorrectCount(0);
    setFinished(false);
    setMissedIds(new Set());
    loadQuestion(fresh[0]);
  }

  function retryMissed() {
    const retryScenarios = shuffle(questions.filter((s) => missedIds.has(s.id)));
    if (retryScenarios.length === 0) return;
    setQuestions(retryScenarios);
    setIndex(0);
    setCorrectCount(0);
    setFinished(false);
    setMissedIds(new Set());
    loadQuestion(retryScenarios[0]);
  }

  function next() {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    loadQuestion(questions[nextIndex]);
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        Navigate — steer to the target one move at a time
      </div>

      {!finished && (
        <div style={{ textAlign: "right", fontSize: "0.78rem", color: "var(--muted)", marginBottom: 10 }}>
          Question {index + 1} of {questions.length}
        </div>
      )}

      {finished ? (
        <div className="callout" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: 6 }}>Results</div>
          <div style={{ marginBottom: 14 }}>
            {correctCount} / {questions.length} reached the target (
            {Math.round((correctCount / questions.length) * 100)}%)
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {missedIds.size > 0 && (
              <button className="btn btn-primary" onClick={retryMissed}>
                Retry Missed ({missedIds.size})
              </button>
            )}
            <button className="btn" onClick={startRound}>
              Retake
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="callout" style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span>
              You're starting at <b>{headingName(scenario.startHeading)}</b>. Get to <b>{headingName(scenario.targetHeading)}</b>.
            </span>
            {!submitted && (
              <button
                className="btn"
                onClick={resetQuestion}
                title="Reset back to the starting point"
                aria-label="Reset diagram"
                style={{ padding: "4px 8px", fontSize: "1rem", lineHeight: 1, flexShrink: 0 }}
              >
                ↺
              </button>
            )}
          </div>

          <BoatDiagram
            heading={currentHeading}
            telltaleInteractive={false}
            tillerSide={tillerSide}
            onTillerSideChange={handleTillerSideChange}
            crewSide={crewSide}
            onCrewSideChange={handleCrewSideChange}
            disabled={submitted}
          />
          <div style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--muted)", marginTop: 4, marginBottom: 12 }}>
            {submitted
              ? "Locked in"
              : "Drag the tiller toward or away from the skipper, or back to center, and use the arrows to move the crew when you're changing sides. Lock in each move, then check when you think you've arrived."}
          </div>

          {moveError && (
            <div className="callout" style={{ marginBottom: 12, borderLeftColor: "var(--bad)", color: "var(--bad)" }}>
              {moveError}
            </div>
          )}

          {moveLog.length > 0 && (
            <div style={{ marginBottom: 14, fontSize: "0.85rem", color: "var(--muted-strong)" }}>
              {moveLog.map((label, i) => (
                <div key={i}>
                  {i + 1}. {label}
                </div>
              ))}
              {!submitted && (
                <button
                  className="btn"
                  onClick={undoLastMove}
                  style={{ marginTop: 8, padding: "4px 10px", fontSize: "0.78rem" }}
                >
                  Undo Last Move
                </button>
              )}
            </div>
          )}

          {!submitted && (
            <button className="btn btn-block" disabled={tillerSide === 0} onClick={lockInMove} style={{ marginBottom: 10 }}>
              Lock In Move
            </button>
          )}

          {!submitted ? (
            <button className="btn btn-primary btn-block" onClick={check}>
              Check My Position
            </button>
          ) : (
            <>
              <div
                className="callout"
                style={{
                  marginBottom: 12,
                  borderLeftColor: isCorrect ? "var(--good)" : "var(--bad)",
                  color: isCorrect ? "var(--good)" : "var(--bad)",
                }}
              >
                <b>
                  {isCorrect
                    ? `Correct! You reached ${headingName(scenario.targetHeading)} in ${moveLog.length} move${moveLog.length === 1 ? "" : "s"}.`
                    : `Not quite — you're at ${headingName(currentHeading)}, not ${headingName(scenario.targetHeading)}.`}
                </b>
              </div>
              <button className="btn btn-primary btn-block" onClick={next}>
                {index + 1 >= questions.length ? "See results →" : "Next Question →"}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
