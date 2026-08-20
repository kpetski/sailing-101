import { useRef, useState } from "react";
import { MANEUVER_LABELS, type Maneuver } from "./PointsOfSailDiagram";

/**
 * Drag-the-telltale practice: given a current point of sail and a target
 * to get to, drag the wind indicator to where it should end up, set the
 * tiller and (when unambiguous) the sheet, move yourself to the new
 * windward rail if the tack changed, then name the maneuver. Unlike the
 * direction drill, every part of this one is checkable, so it grades for
 * real.
 */
const VIEW_W = 200;
const VIEW_H = 195;
const MAST_X = 100;
const MAST_Y = 78;
const INDICATOR_LEN = 68;
const HULL = "M84,174 L116,174 Q122,146 100,122 Q78,146 84,174 Z";
const STERN_X = 100;
const STERN_Y = 174;
const PRESETS = [0, -45, 45, -90, 90, -135, 135, 180] as const;

const TRIM_STOPS: [number, number][] = [
  [0, 0],
  [45, 10],
  [90, 22],
  [135, 32],
  [180, 40],
];

function trimMagnitude(absNd: number) {
  for (let i = 1; i < TRIM_STOPS.length; i++) {
    const [x0, y0] = TRIM_STOPS[i - 1];
    const [x1, y1] = TRIM_STOPS[i];
    if (absNd <= x1) return y0 + ((absNd - x0) / (x1 - x0)) * (y1 - y0);
  }
  return TRIM_STOPS[TRIM_STOPS.length - 1][1];
}

function normalizeDeg(deg: number) {
  const n = (((deg + 180) % 360) + 360) % 360 - 180;
  // Keep dead-downwind headings at +180 rather than -180, so a fall-off from
  // a port-tack broad reach to a run doesn't look like it flipped tacks.
  return n === -180 ? 180 : n;
}

function snapToPreset(deg: number): number {
  const n = deg === -180 ? 180 : deg;
  let best: number = PRESETS[0];
  let bestDiff = Infinity;
  for (const p of PRESETS) {
    const diff = Math.abs(n - p);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = p;
    }
  }
  return best;
}

/** -1/1 = which side the boom is blown out to (leeward); 0 = squared on a run/irons. */
function leanOf(heading: number): -1 | 0 | 1 {
  const nd = normalizeDeg(heading);
  return nd > 0.5 ? 1 : nd < -0.5 ? -1 : 0;
}

/** The rail you'd sit on for a given heading — opposite the boom. 0 = either/centered. */
function windwardOf(heading: number): -1 | 0 | 1 {
  const lean = leanOf(heading);
  return lean === 0 ? 0 : ((-lean) as -1 | 1);
}

function headingName(h: number) {
  const abs = Math.abs(h);
  if (abs === 0) return "Irons";
  if (abs === 180) return "Run";
  const name = abs === 45 ? "Close Reach" : abs === 90 ? "Beam Reach" : "Broad Reach";
  const tack = h > 0 ? "Port Tack" : "Starboard Tack";
  return `${name}, ${tack}`;
}

const TILLER_CHOICES = ["Push Tiller Away", "Pull Tiller Toward You"] as const;
const SHEET_CHOICES = ["Sheet In", "Ease (Sheet Out)"] as const;
const MANEUVER_OPTIONS: Maneuver[] = ["tack", "jibe", "headUp", "fallOff"];

interface Scenario {
  id: string;
  startHeading: number;
  targetHeading: number;
  maneuver: Maneuver;
  tiller: (typeof TILLER_CHOICES)[number];
  /** null when start/target are symmetric (a mirror tack/jibe) — no well-defined net trim trend to grade. */
  sheet: (typeof SHEET_CHOICES)[number] | null;
}

const SCENARIOS: Scenario[] = [
  { id: "headup-1", startHeading: -90, targetHeading: -45, maneuver: "headUp", tiller: "Push Tiller Away", sheet: "Sheet In" },
  { id: "falloff-1", startHeading: 135, targetHeading: 180, maneuver: "fallOff", tiller: "Pull Tiller Toward You", sheet: "Ease (Sheet Out)" },
  { id: "headup-2", startHeading: 90, targetHeading: 45, maneuver: "headUp", tiller: "Push Tiller Away", sheet: "Sheet In" },
  { id: "falloff-2", startHeading: -90, targetHeading: -135, maneuver: "fallOff", tiller: "Pull Tiller Toward You", sheet: "Ease (Sheet Out)" },
  { id: "tack-1", startHeading: -45, targetHeading: 45, maneuver: "tack", tiller: "Push Tiller Away", sheet: null },
  { id: "jibe-1", startHeading: 135, targetHeading: -135, maneuver: "jibe", tiller: "Push Tiller Away", sheet: null },
];

function pickScenario(excludeId: string | null): Scenario {
  const choices = excludeId ? SCENARIOS.filter((s) => s.id !== excludeId) : SCENARIOS;
  return choices[Math.floor(Math.random() * choices.length)];
}

/**
 * One boat, viewed from above with the bow up: drag the gold telltale to
 * the target heading, drag the tiller stick at the stern toward or away
 * from you, and use the arrows to move the little skipper dot to the new
 * windward rail if the tack changed (e.g. on a jibe).
 */
function BoatDiagram({
  heading,
  onHeadingChange,
  tillerValue,
  onTillerChange,
  tillerFeedback,
  tillerWindward,
  crewSide,
  onCrewSideChange,
  disabled,
}: {
  heading: number;
  onHeadingChange: (h: number) => void;
  tillerValue: string | null;
  onTillerChange: (v: string) => void;
  tillerFeedback?: "correct" | "incorrect";
  /** Which rail the skipper dot is currently on — "toward you" means toward this side. */
  tillerWindward: -1 | 1;
  crewSide: -1 | 0 | 1;
  onCrewSideChange: (s: -1 | 1) => void;
  disabled: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingTelltale, setDraggingTelltale] = useState(false);
  const [draggingTiller, setDraggingTiller] = useState(false);

  const nd = normalizeDeg(heading);
  const rad = (nd * Math.PI) / 180;
  const tipX = MAST_X + INDICATOR_LEN * Math.sin(rad);
  const tipY = MAST_Y + INDICATOR_LEN * Math.cos(rad);
  const lean = leanOf(heading);
  const mag = trimMagnitude(Math.abs(nd));
  const jibOut = lean * mag * 0.55;
  const mainOut = lean * mag;

  // Tiller pivots at the rudder head (the stern point) and sweeps forward,
  // into the cockpit — centered when neutral, arcing toward a rail when pushed/pulled.
  // "Toward you" is toward the windward rail, so which screen side that lands
  // on depends on which tack you started the maneuver on.
  const tillerSide =
    tillerValue === "Pull Tiller Toward You" ? tillerWindward : tillerValue === "Push Tiller Away" ? -tillerWindward : 0;
  const TILLER_LEN = 26;
  const tillerAngle = (tillerSide * 32 * Math.PI) / 180;
  const tillerX = STERN_X + TILLER_LEN * Math.sin(tillerAngle);
  const tillerY = STERN_Y - TILLER_LEN * Math.cos(tillerAngle);
  const tillerColor = tillerFeedback === "correct" ? "var(--good)" : tillerFeedback === "incorrect" ? "var(--bad)" : "#c8973a";

  function clientToPoint(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    return pt.matrixTransform(ctm.inverse());
  }

  function angleFromClient(clientX: number, clientY: number): number {
    const loc = clientToPoint(clientX, clientY);
    if (!loc) return heading;
    const angle = (Math.atan2(loc.x - MAST_X, loc.y - MAST_Y) * 180) / Math.PI;
    return snapToPreset(angle);
  }

  function startTelltaleDrag(e: React.PointerEvent) {
    if (disabled) return;
    setDraggingTelltale(true);
    (e.target as Element).setPointerCapture(e.pointerId);
    onHeadingChange(angleFromClient(e.clientX, e.clientY));
  }
  function moveTelltaleDrag(e: React.PointerEvent) {
    if (!draggingTelltale || disabled) return;
    onHeadingChange(angleFromClient(e.clientX, e.clientY));
  }

  function tillerSideFromClient(clientX: number, clientY: number): -1 | 1 {
    const loc = clientToPoint(clientX, clientY);
    if (!loc) return -1;
    return loc.x < STERN_X ? -1 : 1;
  }
  function tillerAnswerFromSide(side: -1 | 1): string {
    return side === tillerWindward ? "Pull Tiller Toward You" : "Push Tiller Away";
  }
  function startTillerDrag(e: React.PointerEvent) {
    if (disabled) return;
    setDraggingTiller(true);
    (e.target as Element).setPointerCapture(e.pointerId);
    onTillerChange(tillerAnswerFromSide(tillerSideFromClient(e.clientX, e.clientY)));
  }
  function moveTillerDrag(e: React.PointerEvent) {
    if (!draggingTiller || disabled) return;
    onTillerChange(tillerAnswerFromSide(tillerSideFromClient(e.clientX, e.clientY)));
  }

  function endDrag() {
    setDraggingTelltale(false);
    setDraggingTiller(false);
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      style={{ display: "block", width: "100%", maxWidth: 380, height: "auto", margin: "0 auto", touchAction: "none" }}
      onPointerMove={(e) => {
        moveTelltaleDrag(e);
        moveTillerDrag(e);
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <path d={HULL} fill="#e4ede8" stroke="#20302c" strokeWidth={1.8} />

      <line x1={MAST_X} y1={122} x2={MAST_X} y2={MAST_Y} stroke="#20302c" strokeWidth={1} opacity={0.5} />
      <path d={`M100,126 Q${(100 + jibOut).toFixed(1)},140 100,148`} fill="none" stroke="#20302c" strokeWidth={1.4} opacity={0.85} />
      <path d={`M100,150 Q${(100 + mainOut).toFixed(1)},160 100,172`} fill="none" stroke="#20302c" strokeWidth={1.4} opacity={0.85} />

      {/* skipper — click an arrow to move to the other rail */}
      <circle cx={MAST_X + crewSide * 14} cy={164} r={4.5} fill="#0f3d3e" stroke="#fff" strokeWidth={1} />
      <polygon
        points="52,164 66,158 66,170"
        fill={crewSide === -1 ? "#0f3d3e" : "#b7c4bd"}
        style={{ cursor: disabled ? "default" : "pointer" }}
        onClick={disabled ? undefined : () => onCrewSideChange(-1)}
      />
      <polygon
        points="148,164 134,158 134,170"
        fill={crewSide === 1 ? "#0f3d3e" : "#b7c4bd"}
        style={{ cursor: disabled ? "default" : "pointer" }}
        onClick={disabled ? undefined : () => onCrewSideChange(1)}
      />

      <circle cx={MAST_X} cy={MAST_Y} r={3.5} fill="#20302c" />
      <line x1={MAST_X} y1={MAST_Y} x2={tipX} y2={tipY} stroke="#c8973a" strokeWidth={3} strokeLinecap="round" />
      <circle
        cx={tipX}
        cy={tipY}
        r={draggingTelltale ? 13 : 10}
        fill="#c8973a"
        opacity={disabled ? 0.9 : 0.35}
        stroke="#c8973a"
        strokeWidth={1.5}
        style={{ cursor: disabled ? "default" : draggingTelltale ? "grabbing" : "grab" }}
        onPointerDown={startTelltaleDrag}
      />
      <circle cx={tipX} cy={tipY} r={4} fill="#c8973a" style={{ pointerEvents: "none" }} />

      {/* tiller, pivoting at the transom */}
      <circle cx={STERN_X} cy={STERN_Y} r={3} fill="#20302c" />
      <line x1={STERN_X} y1={STERN_Y} x2={tillerX} y2={tillerY} stroke={tillerColor} strokeWidth={4} strokeLinecap="round" />
      <circle
        cx={tillerX}
        cy={tillerY}
        r={draggingTiller ? 13 : 10}
        fill={tillerColor}
        opacity={disabled ? 0.9 : 0.35}
        style={{ cursor: disabled ? "default" : draggingTiller ? "grabbing" : "grab" }}
        onPointerDown={startTillerDrag}
      />
    </svg>
  );
}

interface FieldResult {
  ok: boolean;
  label: string;
}

export default function ManeuverGame() {
  const [scenario, setScenario] = useState<Scenario>(() => pickScenario(null));
  const [userHeading, setUserHeading] = useState(scenario.startHeading);
  const [userTiller, setUserTiller] = useState<string | null>(null);
  const [userSheet, setUserSheet] = useState<string | null>(null);
  const [userManeuver, setUserManeuver] = useState<Maneuver | null>(null);
  const [crewSide, setCrewSide] = useState<-1 | 0 | 1>(() => windwardOf(scenario.startHeading));
  const [submitted, setSubmitted] = useState(false);
  const [tally, setTally] = useState({ correct: 0, attempted: 0 });

  const needsSheet = scenario.sheet !== null;
  const expectedCrew = windwardOf(scenario.targetHeading);
  const canCheck = userTiller !== null && userManeuver !== null && (!needsSheet || userSheet !== null);

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
    setTally((t) => ({ correct: t.correct + (allOk ? 1 : 0), attempted: t.attempted + 1 }));
  }

  function next() {
    const s = pickScenario(scenario.id);
    setScenario(s);
    setUserHeading(s.startHeading);
    setUserTiller(null);
    setUserSheet(null);
    setUserManeuver(null);
    setCrewSide(windwardOf(s.startHeading));
    setSubmitted(false);
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

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        Maneuver practice — telltale, tiller, sheet, and the move
      </div>

      <div className="callout" style={{ marginBottom: 14 }}>
        You're currently on <b>{headingName(scenario.startHeading)}</b>. Get to{" "}
        <b>{headingName(scenario.targetHeading)}</b>.
      </div>

      <BoatDiagram
        heading={userHeading}
        onHeadingChange={setUserHeading}
        tillerValue={userTiller}
        onTillerChange={setUserTiller}
        tillerFeedback={submitted ? (userTiller === scenario.tiller ? "correct" : "incorrect") : undefined}
        tillerWindward={(crewSide || 1) as -1 | 1}
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
            Next
          </button>
        </>
      )}

      <div style={{ marginTop: 12, fontSize: "0.8rem", color: "var(--muted)", textAlign: "center" }}>
        {tally.correct} / {tally.attempted} fully correct this session
      </div>
    </div>
  );
}
