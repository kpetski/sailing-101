import { useState } from "react";
import { MANEUVER_LABELS, type Maneuver } from "./PointsOfSailDiagram";
import { shuffle } from "../lib/shuffle";
import { windwardOf, headingName } from "../lib/boatMath";
import BoatDiagram from "./BoatDiagram";
import { useLocalStorage } from "../hooks/useLocalStorage";

/**
 * Drag-the-telltale practice: given a current point of sail and a target
 * to get to, drag the wind indicator to where it should end up, set the
 * tiller and (when unambiguous) the sheet, move yourself to the new
 * windward rail if the tack changed, then name the maneuver. Unlike the
 * direction drill, every part of this one is checkable, so it grades for
 * real. Easy mode only jumps one point of sail at a time; Hard mode can
 * jump several points in a single question (e.g. Close Reach straight to
 * a Run), so the telltale drag covers real distance and the maneuver name
 * has to account for the whole turn, not just the last step of it.
 */

const TILLER_CHOICES = ["Push Tiller Away", "Pull Tiller Toward You"] as const;
const SHEET_CHOICES = ["Sheet In", "Ease (Sheet Out)"] as const;
const MANEUVER_OPTIONS: Maneuver[] = ["tack", "jibe", "headUp", "fallOff"];

interface Scenario {
  id: string;
  startHeading: number;
  targetHeading: number;
  maneuver: Maneuver;
  tiller: (typeof TILLER_CHOICES)[number];
  /** null when the turn is symmetric (a mirror tack/jibe) — no well-defined net trim trend to grade. */
  sheet: (typeof SHEET_CHOICES)[number] | null;
}

/**
 * Works out what the whole turn from start to target is actually called —
 * matching how sailors talk (a bear-away that carries on past the run is
 * just "a jibe", not "fall off then jibe") — rather than hard-coding it
 * per pair. Handles jumps of more than one point of sail the same way a
 * single adjacent step works.
 */
function classifyTurn(start: number, target: number): Pick<Scenario, "maneuver" | "tiller" | "sheet"> {
  const sameSide = start === 180 || target === 180 ? true : Math.sign(start) === Math.sign(target);
  if (sameSide) {
    const startMag = Math.abs(start);
    const targetMag = Math.abs(target);
    if (targetMag < startMag) return { maneuver: "headUp", tiller: "Push Tiller Away", sheet: "Sheet In" };
    return { maneuver: "fallOff", tiller: "Pull Tiller Toward You", sheet: "Ease (Sheet Out)" };
  }
  const total = Math.abs(start) + Math.abs(target);
  if (total < 180) return { maneuver: "tack", tiller: "Push Tiller Away", sheet: null };
  return { maneuver: "jibe", tiller: "Push Tiller Away", sheet: null };
}

function buildScenario(id: string, startHeading: number, targetHeading: number): Scenario {
  return { id, startHeading, targetHeading, ...classifyTurn(startHeading, targetHeading) };
}

// Every single-move variation among the 6 real points of sail (Close/Beam/
// Broad Reach on each tack) — every adjacent head-up/fall-off step both
// ways, plus the two mirror crossings (Close-to-Close is a tack, Broad-to-
// Broad is a jibe). Beam-to-Beam is left out: it's exactly as far via irons
// as via the run, so which maneuver that "should" be is a coin flip. A run
// never appears here either — it's not really "on" one tack or the other,
// so the diagram has to pick an arbitrary side to draw the boom on, which
// reads as a fake tack to cross.
const EASY_PAIRS: [number, number][] = [
  [-45, -90],
  [-90, -45],
  [-90, -135],
  [-135, -90],
  [45, 90],
  [90, 45],
  [90, 135],
  [135, 90],
  [-45, 45],
  [45, -45],
  [135, -135],
  [-135, 135],
];

// Two or three points at once — the telltale has to travel real distance,
// and the maneuver name has to describe the whole turn, not just the end of it.
const HARD_PAIRS: [number, number][] = [
  [-45, -135],
  [135, 45],
  [90, -45],
  [-90, 45],
  [45, -90],
  [-90, 135],
  [90, -135],
  [45, 135],
];

const BASIC_SCENARIOS: Scenario[] = EASY_PAIRS.map(([s, t], i) => buildScenario(`easy-${i}`, s, t));
const ADVANCED_SCENARIOS: Scenario[] = HARD_PAIRS.map(([s, t], i) => buildScenario(`hard-${i}`, s, t));
const SCENARIO_BY_ID: Record<string, Scenario> = Object.fromEntries(
  [...BASIC_SCENARIOS, ...ADVANCED_SCENARIOS].map((s) => [s.id, s])
);

type Mode = "easy" | "hard";

function poolFor(mode: Mode): Scenario[] {
  return mode === "easy" ? BASIC_SCENARIOS : ADVANCED_SCENARIOS;
}

interface FieldResult {
  ok: boolean;
  label: string;
}

export default function ManeuverGame() {
  const [mode, setMode] = useLocalStorage<Mode>("sailing101-maneuver-mode", "easy");
  // A shuffled, fixed-length pass through the current mode's whole pool —
  // same "question X of N" shape as the regular quizzes, not an open-ended draw.
  const [questions, setQuestions] = useState<Scenario[]>(() => shuffle(poolFor(mode)));
  const [index, setIndex] = useState(0);
  const scenario = questions[index];
  const [userHeading, setUserHeading] = useState(scenario.startHeading);
  const [userTiller, setUserTiller] = useState<string | null>(null);
  const [tillerSide, setTillerSide] = useState<-1 | 0 | 1>(0);
  const [userSheet, setUserSheet] = useState<string | null>(null);
  const [userManeuver, setUserManeuver] = useState<Maneuver | null>(null);
  const [crewSide, setCrewSide] = useState<-1 | 0 | 1>(() => windwardOf(scenario.startHeading));
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [missedIds, setMissedIds] = useState<Set<string>>(new Set());

  const needsSheet = scenario.sheet !== null;
  const expectedCrew = windwardOf(scenario.targetHeading);
  const canCheck = userTiller !== null && userManeuver !== null && (!needsSheet || userSheet !== null);
  // Tacking and jibing reference different moments: on a tack you push the
  // tiller and cross to the new rail together, so "away" means away from the
  // rail you started on — you end up on the same side you pushed toward. On
  // a jibe you cross first, then push relative to your new seat — you end up
  // on the opposite side. Head up/fall off never move the crew, so it
  // doesn't matter which reference is used there.
  const tillerReference =
    scenario.maneuver === "jibe" ? ((crewSide || 1) as -1 | 1) : ((windwardOf(scenario.startHeading) || 1) as -1 | 1);

  function results(): FieldResult[] {
    const out: FieldResult[] = [
      { ok: userHeading === scenario.targetHeading, label: `Telltale → ${headingName(scenario.targetHeading)}` },
      { ok: userTiller === scenario.tiller, label: `Tiller → ${scenario.tiller}` },
    ];
    if (expectedCrew !== 0) out.push({ ok: crewSide === expectedCrew, label: "Crew → Windward rail" });
    out.push({ ok: userManeuver === scenario.maneuver, label: `Move → ${MANEUVER_LABELS[scenario.maneuver]}` });
    if (needsSheet) out.push({ ok: userSheet === scenario.sheet, label: `Sheet → ${scenario.sheet}` });
    return out;
  }

  function check() {
    if (!canCheck) return;
    setSubmitted(true);
    const allOk = results().every((r) => r.ok);
    if (allOk) setCorrectCount((n) => n + 1);
    setMissedIds((prev) => {
      const next = new Set(prev);
      if (allOk) next.delete(scenario.id);
      else next.add(scenario.id);
      return next;
    });
  }

  function handleTillerSideChange(side: -1 | 0 | 1) {
    setTillerSide(side);
    setUserTiller(side === 0 ? null : side === tillerReference ? "Pull Tiller Toward You" : "Push Tiller Away");
  }

  function loadQuestion(s: Scenario) {
    setUserHeading(s.startHeading);
    setUserTiller(null);
    setTillerSide(0);
    setUserSheet(null);
    setUserManeuver(null);
    setCrewSide(windwardOf(s.startHeading));
    setSubmitted(false);
  }

  function startRound(newMode: Mode) {
    const shuffled = shuffle(poolFor(newMode));
    setMode(newMode);
    setQuestions(shuffled);
    setIndex(0);
    setCorrectCount(0);
    setFinished(false);
    setMissedIds(new Set());
    loadQuestion(shuffled[0]);
  }

  function retryMissed() {
    const retryScenarios = shuffle([...missedIds].map((id) => SCENARIO_BY_ID[id]).filter((s): s is Scenario => !!s));
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

  const fieldResults = submitted ? results() : null;
  const allCorrect = fieldResults?.every((r) => r.ok) ?? false;

  function choiceStyle(selected: boolean, correctChoice: boolean) {
    if (!submitted) {
      return {
        borderColor: selected ? "var(--deep)" : "var(--line)",
        background: selected ? "#eaf0ee" : "var(--paper-card)",
      };
    }
    if (correctChoice) return { borderColor: "var(--good)", background: "#eaf3f0", color: "var(--good)" };
    if (selected) return { borderColor: "var(--bad)", background: "#f7ecec", color: "var(--bad)" };
    return { borderColor: "var(--line)", background: "var(--paper-card)" };
  }

  function modeButtonStyle(m: Mode) {
    return {
      borderColor: mode === m ? "var(--deep)" : "var(--line)",
      background: mode === m ? "#eaf0ee" : "var(--paper-card)",
      fontWeight: mode === m ? "bold" : "normal",
    } as const;
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        Maneuver practice — telltale, tiller, sheet, and the move
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.78rem", color: "var(--label)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Mode
        </span>
        <button className="btn" style={{ padding: "4px 12px", ...modeButtonStyle("easy") }} onClick={() => mode !== "easy" && startRound("easy")}>
          Easy · {BASIC_SCENARIOS.length} questions
        </button>
        <button className="btn" style={{ padding: "4px 12px", ...modeButtonStyle("hard") }} onClick={() => mode !== "hard" && startRound("hard")}>
          Hard · {ADVANCED_SCENARIOS.length} questions, multi-point turns
        </button>
        {!finished && (
          <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: "var(--muted)" }}>
            Question {index + 1} of {questions.length}
          </span>
        )}
      </div>

      {finished ? (
        <div className="callout" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: 6 }}>Results</div>
          <div style={{ marginBottom: 14 }}>
            {correctCount} / {questions.length} fully correct (
            {Math.round((correctCount / questions.length) * 100)}%)
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {missedIds.size > 0 && (
              <button className="btn btn-primary" onClick={retryMissed}>
                Retry Missed ({missedIds.size})
              </button>
            )}
            <button className="btn" onClick={() => startRound(mode)}>
              Retake
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="callout" style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span>
              You're currently on <b>{headingName(scenario.startHeading)}</b>. Get to{" "}
              <b>{headingName(scenario.targetHeading)}</b>.
            </span>
            {!submitted && (
              <button
                className="btn"
                onClick={() => loadQuestion(scenario)}
                title="Reset the diagram back to the starting point"
                aria-label="Reset diagram"
                style={{ padding: "4px 8px", fontSize: "1rem", lineHeight: 1, flexShrink: 0 }}
              >
                ↺
              </button>
            )}
          </div>

          <BoatDiagram
            heading={userHeading}
            onHeadingChange={setUserHeading}
            tillerSide={tillerSide}
            onTillerSideChange={handleTillerSideChange}
            tillerFeedback={submitted ? (userTiller === scenario.tiller ? "correct" : "incorrect") : undefined}
            crewSide={crewSide}
            onCrewSideChange={setCrewSide}
            disabled={submitted}
          />
          <div style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--muted)", marginTop: 4, marginBottom: 16 }}>
            {submitted
              ? "Locked in"
              : "Drag the gold telltale to your target heading, drag the tiller, and use the arrows to move to the new windward rail if you changed tacks"}
          </div>

          {needsSheet && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: "0.78rem", color: "var(--label)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                Sheet
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SHEET_CHOICES.map((c) => (
                  <button
                    key={c}
                    className="btn"
                    disabled={submitted}
                    onClick={() => setUserSheet(c)}
                    style={{ flex: "1 1 160px", ...choiceStyle(userSheet === c, submitted && scenario.sheet === c) }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: "0.78rem", color: "var(--label)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              Which move is this?
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {MANEUVER_OPTIONS.map((m) => (
                <button
                  key={m}
                  className="btn"
                  disabled={submitted}
                  onClick={() => setUserManeuver(m)}
                  style={{ flex: "1 1 100px", ...choiceStyle(userManeuver === m, submitted && scenario.maneuver === m) }}
                >
                  {MANEUVER_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {!submitted ? (
            <button className="btn btn-primary btn-block" disabled={!canCheck} onClick={check}>
              Check
            </button>
          ) : (
            <>
              <div
                className="callout"
                style={{
                  marginBottom: 12,
                  borderLeftColor: allCorrect ? "var(--good)" : "var(--bad)",
                  color: allCorrect ? "var(--good)" : "var(--bad)",
                }}
              >
                <b>{allCorrect ? "All correct!" : "Not quite — check the highlights above."}</b>
                <div style={{ marginTop: 6, color: "var(--muted-strong)", fontWeight: "normal" }}>
                  {fieldResults!.map((r) => (
                    <div key={r.label}>
                      {r.ok ? "✓" : "✗"} {r.label}
                    </div>
                  ))}
                </div>
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
