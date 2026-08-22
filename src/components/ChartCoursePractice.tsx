import { useRef, useState } from "react";
import { windwardOf, headingName, REAL_POINTS, applyHeadingMove, legalNextHeadings } from "../lib/boatMath";
import BoatDiagram from "./BoatDiagram";
import LakeMap, { isSafelyInsideLake, type LakeObstacle } from "./LakeMap";

/**
 * Chart a Course: same steering controls as Navigate (tiller + crew, one
 * real move at a time), but instead of a named target point of sail, the
 * goal is a mark on a map — the boat actually moves and turns on the chart,
 * and you have to work out which points of sail get you there, tacking or
 * jibing as needed. Every generated mark is reachable in a handful of moves
 * (it's built from a random walk over the same legal moves you have), so
 * there's always a real solution, even though your own route doesn't have
 * to match it exactly.
 *
 * Some scenarios add a hazard (one rock to sail around, or two flanking a
 * channel to thread) placed on the straight line between start and mark —
 * see buildObstacles for how placement guarantees the walked solution still
 * gets through, even though a naive direct line wouldn't.
 */
const STEP = 42;
const ORIGIN = { x: 260, y: 190 };
const CAPTURE_RADIUS = 14;
const ROUND_SIZE = 8;
// Extra clearance added to an obstacle's radius when checking whether a leg
// of travel clips it — accounts for the boat's own size, not just its center point.
const HIT_BUFFER = 7;

interface ChartScenario {
  id: string;
  startHeading: number;
  markX: number;
  markY: number;
  obstacles: LakeObstacle[];
}

function headingDelta(heading: number): [number, number] {
  const rad = (heading * Math.PI) / 180;
  return [STEP * Math.sin(rad), -STEP * Math.cos(rad)];
}

/** Shortest distance from point (px,py) to the segment a→b. */
function pointSegmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function segmentHitsObstacle(ax: number, ay: number, bx: number, by: number, obstacle: LakeObstacle): boolean {
  return pointSegmentDistance(obstacle.x, obstacle.y, ax, ay, bx, by) <= obstacle.r + HIT_BUFFER;
}

type ScenarioVariant = "open" | "obstacle" | "channel";

function pickVariant(): ScenarioVariant {
  const r = Math.random();
  if (r < 0.55) return "open";
  if (r < 0.85) return "obstacle";
  return "channel";
}

function walkPath(startHeading: number, legs: number): [number, number][] {
  let heading = startHeading;
  let x = ORIGIN.x;
  let y = ORIGIN.y;
  const path: [number, number][] = [[x, y]];
  for (let i = 0; i < legs; i++) {
    // Holding the current heading is a legal "move" too — weighted extra so
    // real straight-line runs show up, not just a maneuver every leg.
    const options = [...legalNextHeadings(heading), heading, heading];
    heading = options[Math.floor(Math.random() * options.length)];
    const [dx, dy] = headingDelta(heading);
    x += dx;
    y += dy;
    path.push([x, y]);
  }
  return path;
}

/**
 * Places a hazard (or, for a channel, two flanking hazards) on the straight
 * line between the start and the mark — squarely in the way of a naive
 * direct shot — then verifies the actual walked solution path doesn't clip
 * it. Returns null if it does, so the caller can retry with a fresh walk
 * rather than ever hand out an unsolvable scenario.
 */
function buildObstacles(variant: ScenarioVariant, path: [number, number][]): LakeObstacle[] | null {
  if (variant === "open") return [];

  const [startX, startY] = path[0];
  const [endX, endY] = path[path.length - 1];
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  const obstacles: LakeObstacle[] =
    variant === "obstacle"
      ? [{ x: midX, y: midY, r: 20 }]
      : [
          { x: midX + nx * 32, y: midY + ny * 32, r: 20 },
          { x: midX - nx * 32, y: midY - ny * 32, r: 20 },
        ];

  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i];
    const [bx, by] = path[i + 1];
    for (const obs of obstacles) {
      if (segmentHitsObstacle(ax, ay, bx, by, obs)) return null;
    }
  }
  return obstacles;
}

function generateScenario(id: string): ChartScenario {
  const variant = pickVariant();
  for (let attempt = 0; attempt < 40; attempt++) {
    const startHeading = REAL_POINTS[Math.floor(Math.random() * REAL_POINTS.length)];
    const legs = 3 + Math.floor(Math.random() * 3);
    const path = walkPath(startHeading, legs);
    const [markX, markY] = path[path.length - 1];
    if (Math.hypot(markX - ORIGIN.x, markY - ORIGIN.y) < STEP * 1.5) continue;
    // The lake is an irregular blob, not a rectangle — a mark generated from
    // plain coordinate math can land past the shoreline. Reject anything
    // that isn't safely surrounded by water before it's ever shown.
    if (!isSafelyInsideLake(markX, markY, 16)) continue;
    const obstacles = buildObstacles(variant, path);
    if (obstacles === null) continue;
    if (obstacles.some((o) => !isSafelyInsideLake(o.x, o.y, o.r + 4))) continue;
    return { id, startHeading, markX, markY, obstacles };
  }
  // Fallback after repeated bad luck placing a hazard or a mark near the
  // shore: plain open water, same guarantees as above, generously capped
  // so it can't spin forever even in a pathological case.
  let startHeading: number = REAL_POINTS[0];
  let markX = ORIGIN.x;
  let markY = ORIGIN.y;
  for (let attempt = 0; attempt < 200; attempt++) {
    startHeading = REAL_POINTS[Math.floor(Math.random() * REAL_POINTS.length)];
    const path = walkPath(startHeading, 3 + Math.floor(Math.random() * 3));
    [markX, markY] = path[path.length - 1];
    if (Math.hypot(markX - ORIGIN.x, markY - ORIGIN.y) < STEP * 1.5) continue;
    if (!isSafelyInsideLake(markX, markY, 16)) continue;
    break;
  }
  return { id, startHeading, markX, markY, obstacles: [] };
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
  const [showLog, setShowLog] = useState(false);
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

  function applyResolvedMove(newHeading: number, label: string, nextX: number, nextY: number) {
    setHistory((h) => [...h, { heading: currentHeading, crewSide, x: boatX, y: boatY }]);
    setCurrentHeading(newHeading);
    setBoatX(nextX);
    setBoatY(nextY);
    setTrail((t) => [...t, [nextX, nextY]]);
    setMoveLog((log) => [...log, label]);
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

  function tryMove(newHeading: number, label: string) {
    const [dx, dy] = headingDelta(newHeading);
    const nextX = boatX + dx;
    const nextY = boatY + dy;
    const blocked = scenario.obstacles.some((obs) => segmentHitsObstacle(boatX, boatY, nextX, nextY, obs));
    if (blocked) {
      setMoveError(
        scenario.obstacles.length > 1
          ? "That course runs into one of the hazards — try lining up with the gap between them."
          : "That course runs straight into the hazard — try a different heading to go around it."
      );
      return;
    }
    applyResolvedMove(newHeading, label, nextX, nextY);
  }

  function lockInMove() {
    if (submitted) return;
    // Tiller centered = hold the current heading and keep sailing straight —
    // no maneuver, so none of the turn rules apply.
    if (tillerSide === 0) {
      tryMove(currentHeading, `Held course on ${headingName(currentHeading)}`);
      return;
    }
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
    tryMove(result.newHeading, result.label);
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
    setShowLog(false);
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
    setShowLog(false);
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

  // Fixed reserve matching the sticky primary-move button's own height, so
  // it never sticks on top of the boat diagram's interactive controls above
  // it. Only that one button is sticky — it's the one pressed every move,
  // unlike Give Up / the result / Next Question, which are once-per-question.
  const STICKY_BUTTON_RESERVE = 56;

  const hazardHint =
    scenario.obstacles.length === 0
      ? null
      : scenario.obstacles.length > 1
        ? "Thread the gap between the hazards."
        : "Sail around the hazard.";

  return (
    <div className="card" style={{ marginBottom: 20, paddingBottom: 8 }}>
      <div className="eyebrow" style={{ marginBottom: 3 }}>
        Chart a Course — sail to the mark, one move at a time
      </div>

      {!finished && (
        <div style={{ textAlign: "right", fontSize: "0.78rem", color: "var(--muted)", marginBottom: 3 }}>
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
          <div className="callout" style={{ marginBottom: 6, padding: "6px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: "0.92rem" }}>
              You're on <b>{headingName(currentHeading)}</b>. Sail to the mark.
              {hazardHint && <span style={{ color: "var(--rust)" }}> {hazardHint}</span>}
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

          <div style={{ maxWidth: 200, margin: "0 auto" }}>
            <LakeMap
              boats={[{ x: boatX, y: boatY, heading: currentHeading, color: submitted ? (isCorrect ? "#2f7a5c" : "#a4433a") : "#0f3d3e" }]}
              marks={[{ x: scenario.markX, y: scenario.markY, label: "Goal" }]}
              routes={trail.length > 1 ? [{ points: trail, color: "#1f6f6b", label: "" }] : []}
              obstacles={scenario.obstacles}
            />
          </div>

          <div style={{ marginTop: 2, maxWidth: 235, marginLeft: "auto", marginRight: "auto" }}>
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

          {moveError && (
            <div className="callout" style={{ marginBottom: 8, padding: "6px 12px", borderLeftColor: "var(--bad)", color: "var(--bad)", fontSize: "0.85rem" }}>
              {moveError}
            </div>
          )}

          {moveLog.length > 0 && (
            <div style={{ marginBottom: 6, fontSize: "0.82rem", color: "var(--muted-strong)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button
                  className="btn"
                  onClick={() => setShowLog((v) => !v)}
                  style={{ padding: "3px 9px", fontSize: "0.76rem" }}
                >
                  {showLog ? "Hide" : "Show"} moves ({moveLog.length})
                </button>
                {!submitted && (
                  <button className="btn" onClick={undoLastMove} style={{ padding: "3px 9px", fontSize: "0.76rem" }}>
                    Undo Last Move
                  </button>
                )}
              </div>
              {showLog && (
                <div style={{ marginTop: 6 }}>
                  {moveLog.map((label, i) => (
                    <div key={i}>
                      {i + 1}. {label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sticky: only the button pressed every single move, so it's always
              reachable without scrolling. Everything below it (Give Up, the
              result, Next Question) happens once per question, not once per
              move, so it stays in normal flow instead of competing for the
              same pinned space. */}
          {!submitted && (
            <>
              <div style={{ height: STICKY_BUTTON_RESERVE }} />
              <div style={{ position: "sticky", bottom: 0, background: "var(--paper-card)", paddingTop: 8, paddingBottom: 8 }}>
                <button className="btn btn-block" onClick={lockInMove}>
                  {tillerSide === 0 ? "Continue Straight" : "Lock In Move"}
                </button>
              </div>
              {moveLog.length > 0 && (
                <button className="btn btn-block" onClick={check} style={{ marginTop: 8 }}>
                  Give Up
                </button>
              )}
            </>
          )}

          {submitted && (
            <>
              <div
                className="callout"
                style={{
                  marginBottom: 8,
                  padding: "8px 12px",
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
