import { useRef, useState } from "react";
import { normalizeDeg, leanOf, trimMagnitude, snapToPreset } from "../lib/boatMath";

const VIEW_W = 200;
const VIEW_H = 195;
const MAST_X = 100;
const MAST_Y = 78;
const INDICATOR_LEN = 68;
const HULL = "M84,174 L116,174 Q122,146 100,122 Q78,146 84,174 Z";
const STERN_X = 100;
const STERN_Y = 174;

/**
 * One boat, viewed from above with the bow up: the gold telltale shows the
 * current heading, the tiller stick at the stern drags toward or away from
 * you, and the arrows move the little skipper dot to the new windward rail
 * when the tack changes (e.g. on a jibe). Set telltaleInteractive={false}
 * when the heading should only ever change as a result of locking in a
 * move (Navigate) rather than being dragged directly (Maneuver Practice).
 */
export default function BoatDiagram({
  heading,
  onHeadingChange,
  telltaleInteractive = true,
  tillerSide,
  onTillerSideChange,
  tillerFeedback,
  crewSide,
  onCrewSideChange,
  disabled,
}: {
  heading: number;
  onHeadingChange?: (h: number) => void;
  telltaleInteractive?: boolean;
  /** Raw screen side the tiller handle is dragged to — fixed once set, independent of later crew moves. 0 = centered/neutral. */
  tillerSide: -1 | 0 | 1;
  onTillerSideChange: (s: -1 | 0 | 1) => void;
  tillerFeedback?: "correct" | "incorrect";
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
  // It stays wherever it was dragged even if the skipper dot moves afterward —
  // e.g. on a tack, you push it toward the rail you're about to move to, so it
  // should end up on the same side as the dot, not flip when the dot moves.
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
    if (disabled || !telltaleInteractive || !onHeadingChange) return;
    setDraggingTelltale(true);
    (e.target as Element).setPointerCapture(e.pointerId);
    onHeadingChange(angleFromClient(e.clientX, e.clientY));
  }
  function moveTelltaleDrag(e: React.PointerEvent) {
    if (!draggingTelltale || disabled || !onHeadingChange) return;
    onHeadingChange(angleFromClient(e.clientX, e.clientY));
  }

  // A dead zone around the pivot lets the tiller be dragged back to center —
  // not just to a side — so it can be deliberately neutralized between moves.
  const CENTER_DEAD_ZONE = 18;
  function tillerSideFromClient(clientX: number, clientY: number): -1 | 0 | 1 {
    const loc = clientToPoint(clientX, clientY);
    if (!loc) return -1;
    if (Math.abs(loc.x - STERN_X) < CENTER_DEAD_ZONE) return 0;
    return loc.x < STERN_X ? -1 : 1;
  }
  function startTillerDrag(e: React.PointerEvent) {
    if (disabled) return;
    setDraggingTiller(true);
    (e.target as Element).setPointerCapture(e.pointerId);
    onTillerSideChange(tillerSideFromClient(e.clientX, e.clientY));
  }
  function moveTillerDrag(e: React.PointerEvent) {
    if (!draggingTiller || disabled) return;
    onTillerSideChange(tillerSideFromClient(e.clientX, e.clientY));
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

      {/* skipper — click an arrow to move to the other rail. Each arrow gets
          an invisible, larger rect underneath sharing its onClick — the
          visible triangle alone is too small a target on a phone. */}
      <circle cx={MAST_X + crewSide * 14} cy={164} r={4.5} fill="#0f3d3e" stroke="#fff" strokeWidth={1} />
      <rect
        x={40}
        y={148}
        width={30}
        height={44}
        fill="#000"
        opacity={0}
        style={{ cursor: disabled ? "default" : "pointer" }}
        onClick={disabled ? undefined : () => onCrewSideChange(-1)}
      />
      <polygon
        points="52,164 66,158 66,170"
        fill={crewSide === -1 ? "#0f3d3e" : "#b7c4bd"}
        style={{ cursor: disabled ? "default" : "pointer" }}
        onClick={disabled ? undefined : () => onCrewSideChange(-1)}
      />
      <rect
        x={130}
        y={148}
        width={30}
        height={44}
        fill="#000"
        opacity={0}
        style={{ cursor: disabled ? "default" : "pointer" }}
        onClick={disabled ? undefined : () => onCrewSideChange(1)}
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
        opacity={disabled ? 0.9 : telltaleInteractive ? 0.35 : 0.9}
        stroke="#c8973a"
        strokeWidth={1.5}
        style={{ cursor: disabled || !telltaleInteractive ? "default" : draggingTelltale ? "grabbing" : "grab" }}
        onPointerDown={startTelltaleDrag}
      />
      <circle cx={tipX} cy={tipY} r={4} fill="#c8973a" style={{ pointerEvents: "none" }} />

      {/* tiller, pivoting at the transom */}
      <circle cx={STERN_X} cy={STERN_Y} r={3} fill="#20302c" />
      <line x1={STERN_X} y1={STERN_Y} x2={tillerX} y2={tillerY} stroke={tillerColor} strokeWidth={4} strokeLinecap="round" />
      {/* Invisible, much larger grab area underneath the visible handle — at
          this diagram's typical render size the visible handle alone (r=10-13
          in a 200-wide viewBox) is far too small a target to reliably grab
          with a finger. Enlarging just the hit area (not the visual size)
          fixes that without costing screen space elsewhere. */}
      <circle
        cx={tillerX}
        cy={tillerY}
        r={24}
        fill="#000"
        opacity={0}
        style={{ cursor: disabled ? "default" : draggingTiller ? "grabbing" : "grab", touchAction: "none" }}
        onPointerDown={startTillerDrag}
      />
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
