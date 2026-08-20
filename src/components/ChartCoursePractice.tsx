import { useRef, useState } from "react";
import { windwardOf, headingName, REAL_POINTS, applyHeadingMove, legalNextHeadings } from "../lib/boatMath";
import BoatDiagram from "./BoatDiagram";
import LakeMap from "./LakeMap";

/**
 * Chart a Course: same steering controls as Navigate (tiller + crew, one
 * real move at a time), but instead of a named target point of sail, the
 * goal is a mark on a map — the boat actually moves and turns on the chart,
 * and you have to work out which points of sail get you there, tacking or
 * jibing as needed. Every generated mark is reachable in a handful of moves
 * (it's built from a random walk over the same legal moves you have), so
 * there's always a real solution, even though your own route doesn't have
 * to match it exactly.
 */
const STEP = 42;
const ORIGIN = { x: 260, y: 190 };
const CAPTURE_RADIUS = 14;
const ROUND_SIZE = 8;

interface ChartScenario {
  id: string;
  startHeading: number;
  markX: number;
  markY: number;
}

function headingDelta(heading: number): [number, number] {
  const rad = (heading * Math.PI) / 180;
  return [STEP * Math.sin(rad), -STEP * Math.cos(rad)];
}

function generateScenario(id: string): ChartScenario {
  let startHeading: number = REAL_POINTS[0];
  let markX = ORIGIN.x;
  let markY = ORIGIN.y;
  // Retry if the walk happened to land back on (or very near) the start.
  do {
    startHeading = REAL_POINTS[Math.floor(Math.random() * REAL_POINTS.length)];
    let heading: number = startHeading;
    let x = ORIGIN.x;
    let y = ORIGIN.y;
    const legs = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < legs; i++) {
      const options = legalNextHeadings(heading);
      heading = options[Math.floor(Math.random() * options.length)];
      const [dx, dy] = headingDelta(heading);
      x += dx;
      y += dy;
    }
    markX = x;
    markY = y;
  } while (Math.hypot(markX - ORIGIN.x, markY - ORIGIN.y) < STEP * 1.5);
  return { id, startHeading, markX, markY };
}

function generateRound(n: number): ChartScenario[] {
  return Array.from({ length: n }, (_, i) => generateScenario(`chart-${i}-${Math.random().toString(36).slice(2, 7)}`));
}

export default function ChartCoursePractice() {
  const [questions, setQuestions] = useState<ChartScenario[]>(() => generateRound(ROUND_SIZE));
  const [index, setIndex] = useState(0);
  const scenario = questions[index];
  const [currentHeading, setCurrentHeading] = useState(scenario.startHeading);
  const [boatX, setBoatX] = useState(ORIGIN.x);
  const [boatY, setBoatY] = useState(ORIGIN.y);
  const [trail, setTrail] = useState<[number, number][]>([[ORIGIN.x, ORIGIN.y]]);
  const [tillerSide, setTillerSide] = useState<-1 | 0 | 1>(0);
  const [crewSide, setCrewSide] = useState<-1 | 0 | 1>(() => windwardOf(scenario.startHeading));
  const [moveLog, setMoveLog] = useState<string[]>([]);
  // Snapshot taken right before each locked-in move, so a mis-click can be undone.
  const [history, setHistory] = useState<{ heading: number; crewSide: -1 | 0 | 1; x: number; y: number }[]>([]);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [missedIds, setMissedIds] = useState<Set<string>>(new Set());

  // Same jibe-sequencing rules as Navigate: center, then crew, then push.
  // Tack is unordered — see boatMath's applyHeadingMove for the underlying rules.
  const actionSeq = useRef(0);
  const [tillerCenterTick, setTillerCenterTick] = useState(0);
  const [crewMoveTick, setCrewMoveTick] = useState(0);
  const [tillerPushTick, setTillerPushTick] = useState(0);

  const isCorrect = Math.hypot(boatX - scenario.markX, boatY - scenario.markY) <= CAPTURE_RADIUS;

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
        setMoveError("For a jibe, move the crew to the new rail first, then push the tiller — not the other way around.");
        return;
      }
    }
    const result = applyHeadingMove(currentHeading, tillerSide, crewSide);
    if (!result.ok) {
      setMoveError(result.error);
      return;
    }
    const [dx, dy] = headingDelta(result.newHeading);
    const nextX = boatX + dx;
    const nextY = boatY + dy;
    setHistory((h) => [...h, { heading: currentHeading, crewSide, x: boatX, y: boatY }]);
    setCurrentHeading(result.newHeading);
    setBoatX(nextX);
    setBoatY(nextY);
    setTrail((t) => [...t, [nextX, nextY]]);
    setMoveLog((log) => [...log, result.label]);
    // Leave the tiller where it is rather than snapping back to center — see
    // Navigate for why. Centers at Check, or whenever you drag it back
    // yourself to steady up before starting a new maneuver.
    setMoveError(null);
    resetSequenceTicks();

    // Reaching the mark is a visual, spatial thing — no need to make you
    // click a separate button to confirm what's plainly true on the map.
    if (Math.hypot(nextX - scenario.markX, nextY - scenario.markY) <= CAPTURE_RADIUS) {
      setSubmitted(true);
      setTillerSide(0);
      setCorrectCount((n) => n + 1);
      setMissedIds((prev) => {
        const next = new Set(prev);
        next.delete(scenario.id);
        return next;
      });
    }
  }

  function undoLastMove() {
    if (submitted || history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrentHeading(prev.heading);
    setCrewSide(prev.crewSide);
    setBoatX(prev.x);
    setBoatY(prev.y);
    setTrail((t) => t.slice(0, -1));
    setMoveLog((log) => log.slice(0, -1));
    setTillerSide(0);
    setMoveError(null);
    resetSequenceTicks();
  }

  function resetQuestion() {
    setCurrentHeading(scenario.startHeading);
    setBoatX(ORIGIN.x);
    setBoatY(ORIGIN.y);
    setTrail([[ORIGIN.x, ORIGIN.y]]);
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

  function loadQuestion(s: ChartScenario) {
    setCurrentHeading(s.startHeading);
    setBoatX(ORIGIN.x);
    setBoatY(ORIGIN.y);
    setTrail([[ORIGIN.x, ORIGIN.y]]);
    setTillerSide(0);
    setCrewSide(windwardOf(s.startHeading));
    setMoveLog([]);
    setHistory([]);
    setMoveError(null);
    setSubmitted(false);
    resetSequenceTicks();
  }

  function startRound() {
    const fresh = generateRound(ROUND_SIZE);
    setQuestions(fresh);
    setIndex(0);
    setCorrectCount(0);
    setFinished(false);
    setMissedIds(new Set());
    loadQuestion(fresh[0]);
  }

  function retryMissed() {
    const retryScenarios = questions.filter((s) => missedIds.has(s.id));
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
        Chart a Course — sail to the mark, one move at a time
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
            {correctCount} / {questions.length} reached the mark (
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
              You're on <b>{headingName(currentHeading)}</b>. Sail to the mark.
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

          <LakeMap
            boats={[{ x: boatX, y: boatY, heading: currentHeading, color: submitted ? (isCorrect ? "#2f7a5c" : "#a4433a") : "#0f3d3e" }]}
            marks={[{ x: scenario.markX, y: scenario.markY, label: "Goal" }]}
            routes={trail.length > 1 ? [{ points: trail, color: "#1f6f6b", label: "" }] : []}
          />

          <div style={{ marginTop: 14 }}>
            <BoatDiagram
              heading={currentHeading}
              telltaleInteractive={false}
              tillerSide={tillerSide}
              onTillerSideChange={handleTillerSideChange}
              crewSide={crewSide}
              onCrewSideChange={handleCrewSideChange}
              disabled={submitted}
            />
          </div>
          <div style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--muted)", marginTop: 4, marginBottom: 12 }}>
            {submitted
              ? "Locked in"
              : "Drag the tiller toward or away from the skipper, or back to center, and use the arrows to move the crew when you're changing sides. Lock in each move — you'll know you've made it when you reach the mark."}
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
            moveLog.length > 0 && (
              <button className="btn btn-block" onClick={check}>
                Give Up
              </button>
            )
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
                    ? `Correct! You reached the mark in ${moveLog.length} move${moveLog.length === 1 ? "" : "s"}.`
                    : "Not quite — you didn't reach the mark."}
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
