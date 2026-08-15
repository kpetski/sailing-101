import { useId } from "react";

/**
 * Wheel geometry + wind-angle math ported directly from the original
 * sailing-maneuvers.html reference implementation. Angles are "wheel degrees":
 * 0 = pointing dead upwind (into the No-Go Zone), positive = clockwise
 * (starboard tack side), negative = counter-clockwise (port tack side),
 * ±180 = dead downwind (run).
 */
const VIEW_W = 320;
const VIEW_H = 340;
const CX = 160;
const CY = 185;
const WHEEL_R = 115;
const BOAT_R = 78;
const MARKER_R = 104;

function polarToXY(deg: number, radius: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function normalizeDeg(deg: number) {
  return (((deg + 180) % 360) + 360) % 360 - 180;
}

export type Maneuver = "tack" | "jibe" | "headUp" | "fallOff";

export const MANEUVER_COLORS: Record<Maneuver, string> = {
  tack: "#1f6f6b",
  jibe: "#b5533c",
  headUp: "#0f3d3e",
  fallOff: "#c8973a",
};

export const MANEUVER_LABELS: Record<Maneuver, string> = {
  tack: "Tack",
  jibe: "Jibe",
  headUp: "Head Up",
  fallOff: "Fall Off",
};

export interface BoatSpec {
  /** Wheel-degrees heading; 0 = dead upwind, ±180 = dead downwind. */
  heading: number;
  color?: string;
  label?: string;
  /** Dashed hull outline — used for an "end" position in a before/after pair. */
  dashed?: boolean;
}

export interface TurnArcSpec {
  from: number;
  to: number;
  color: string;
}

export interface PointsOfSailDiagramProps {
  /** One boat (single point-of-sail view) or two (before/after a maneuver). */
  boats: BoatSpec | BoatSpec[];
  /** Dashed arc + arrowhead showing the turn direction between two boats. */
  turnArc?: TurnArcSpec;
  /** Wheel-degrees position of an obstacle marker (rocks/shoal/✕). */
  obstacleAt?: number;
  /** Wheel-degrees position of a target marker (ring). */
  targetAt?: number;
  className?: string;
}

function BoatIcon({
  deg,
  color,
  label,
  dashed,
}: {
  deg: number;
  color: string;
  label?: string;
  dashed?: boolean;
}) {
  const { x, y } = polarToXY(deg, BOAT_R);
  const rot = deg;
  const nd = normalizeDeg(deg);
  // which side is the boom (leeward) on, in the boat's own local frame
  const boomSide = nd > 0.5 ? 1 : nd < -0.5 ? -1 : 0;
  const windwardSide = -boomSide;
  const boomMag = Math.min(88, Math.max(18, Math.abs(nd)));
  const rad = (boomMag * Math.PI) / 180;
  const boomLen = 15;
  const boomTipX = boomSide * boomLen * Math.sin(rad);
  const boomTipY = -4 + boomLen * Math.cos(rad);

  const windMag = Math.min(90, Math.abs(nd));
  const wRad = (windMag * Math.PI) / 180;
  const wLen = 12;
  const wSide = windwardSide === 0 ? 1 : windwardSide;
  const wTipX = wSide * wLen * Math.sin(wRad);
  const wTipY = -3 + wLen * Math.cos(wRad);

  const labelPos = {
    x: x + Math.sin((rot * Math.PI) / 180) * 30,
    y: y - Math.cos((rot * Math.PI) / 180) * 30,
  };

  return (
    <>
      <g transform={`translate(${x},${y}) rotate(${rot})`}>
        <polygon
          points="0,-16 8,12 0,7 -8,12"
          fill={color}
          stroke="#20302c"
          strokeWidth={1}
        />
        <line
          x1={0}
          y1={-16}
          x2={0}
          y2={10}
          stroke="#20302c"
          strokeWidth={1}
          strokeDasharray={dashed ? "2,2" : "0"}
        />
        {boomSide === 0 ? (
          <line
            x1={0}
            y1={-4}
            x2={0}
            y2={11}
            stroke="#8a8168"
            strokeWidth={1.5}
            strokeDasharray="1.5,2"
          />
        ) : (
          <line
            x1={0}
            y1={-4}
            x2={boomTipX.toFixed(1)}
            y2={boomTipY.toFixed(1)}
            stroke="#20302c"
            strokeWidth={1.6}
          />
        )}
        <line
          x1={(wSide * 5).toFixed(1)}
          y1={-3}
          x2={wTipX.toFixed(1)}
          y2={wTipY.toFixed(1)}
          stroke="#c8973a"
          strokeWidth={1.4}
        />
        <circle cx={wTipX.toFixed(1)} cy={wTipY.toFixed(1)} r={1.4} fill="#c8973a" />
        <circle
          cx={(windwardSide * 6.5).toFixed(1)}
          cy={9}
          r={2.2}
          fill="#0f3d3e"
          stroke="#fff"
          strokeWidth={0.6}
        >
          <title>helmsperson</title>
        </circle>
      </g>
      {label && (
        <text
          x={labelPos.x}
          y={labelPos.y}
          fontSize={11}
          fill="#20302c"
          textAnchor="middle"
          fontFamily="Georgia,serif"
        >
          {label}
        </text>
      )}
    </>
  );
}

function WindArrow() {
  return (
    <g>
      <line
        x1={CX}
        y1={CY - WHEEL_R}
        x2={CX}
        y2={CY + WHEEL_R}
        stroke="#9ab3ab"
        strokeWidth={1}
        strokeDasharray="3,4"
        opacity={0.6}
      />
      <line
        x1={CX}
        y1={26}
        x2={CX}
        y2={CY - WHEEL_R + 4}
        stroke="#b5533c"
        strokeWidth={5}
        markerEnd="url(#windhead)"
      />
      <text
        x={CX}
        y={16}
        fontSize={13}
        fontWeight="bold"
        fill="#b5533c"
        textAnchor="middle"
        fontFamily="Georgia,serif"
      >
        WIND FROM HERE
      </text>
    </g>
  );
}

function NoGoZone() {
  const a1 = -32;
  const a2 = 32;
  const p1 = polarToXY(a1, WHEEL_R);
  const p2 = polarToXY(a2, WHEEL_R);
  return (
    <path
      d={`M ${CX} ${CY} L ${p1.x} ${p1.y} A ${WHEEL_R} ${WHEEL_R} 0 0 1 ${p2.x} ${p2.y} Z`}
      fill="#a9c9c2"
      opacity={0.7}
    />
  );
}

function HalfShading() {
  return (
    <>
      <path
        d={`M ${CX - WHEEL_R} ${CY} A ${WHEEL_R} ${WHEEL_R} 0 0 1 ${CX + WHEEL_R} ${CY}`}
        fill="none"
        stroke="#7fb3ab"
        strokeWidth={26}
        opacity={0.35}
      />
      <path
        d={`M ${CX - WHEEL_R} ${CY} A ${WHEEL_R} ${WHEEL_R} 0 0 0 ${CX + WHEEL_R} ${CY}`}
        fill="none"
        stroke="#3f5c56"
        strokeWidth={26}
        opacity={0.3}
      />
    </>
  );
}

function ObstacleMark({ deg }: { deg: number }) {
  const { x, y } = polarToXY(deg, MARKER_R);
  return (
    <>
      <circle cx={x} cy={y} r={14} fill="#b5533c" opacity={0.85} />
      <text x={x} y={y + 4} fontSize={14} textAnchor="middle" fill="#fff">
        ✕
      </text>
    </>
  );
}

function TargetMark({ deg }: { deg: number }) {
  const { x, y } = polarToXY(deg, MARKER_R);
  return (
    <>
      <circle cx={x} cy={y} r={9} fill="none" stroke="#c8973a" strokeWidth={3} />
      <circle cx={x} cy={y} r={3} fill="#c8973a" />
    </>
  );
}

function CurvedPath({
  deg1,
  deg2,
  color,
  markerId,
}: {
  deg1: number;
  deg2: number;
  color: string;
  markerId: string;
}) {
  const p1 = polarToXY(deg1, BOAT_R);
  const p2 = polarToXY(deg2, BOAT_R);
  const diff = deg2 - deg1;
  const sweep = diff > 0 ? 1 : 0;
  const large = Math.abs(diff) > 180 ? 1 : 0;
  return (
    <path
      d={`M ${p1.x} ${p1.y} A ${BOAT_R} ${BOAT_R} 0 ${large} ${sweep} ${p2.x} ${p2.y}`}
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeDasharray="6,5"
      markerEnd={`url(#${markerId})`}
    />
  );
}

/**
 * Reusable points-of-sail wheel diagram. Wind blows from the top of the
 * frame; the wheel shows the No-Go Zone, upwind/downwind shading, boat
 * heading(s), boom trim, helmsperson position, and the shroud wind indicator.
 */
export default function PointsOfSailDiagram({
  boats,
  turnArc,
  obstacleAt,
  targetAt,
  className,
}: PointsOfSailDiagramProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const boatList = Array.isArray(boats) ? boats : [boats];
  const arcMarkerId = `arrow-${uid}`;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        background: "#eef4f0",
        borderRadius: 8,
        border: "1px solid #c9bfa5",
      }}
    >
      <defs>
        <marker id="windhead" markerWidth={8} markerHeight={8} refX={6} refY={4} orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#b5533c" />
        </marker>
        {turnArc && (
          <marker id={arcMarkerId} markerWidth={8} markerHeight={8} refX={6} refY={4} orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={turnArc.color} />
          </marker>
        )}
      </defs>
      <HalfShading />
      <NoGoZone />
      <circle cx={CX} cy={CY} r={WHEEL_R} fill="none" stroke="#c9bfa5" strokeWidth={1} />
      <WindArrow />
      {obstacleAt !== undefined && <ObstacleMark deg={obstacleAt} />}
      {targetAt !== undefined && <TargetMark deg={targetAt} />}
      {turnArc && (
        <CurvedPath deg1={turnArc.from} deg2={turnArc.to} color={turnArc.color} markerId={arcMarkerId} />
      )}
      {boatList.map((boat, i) => (
        <BoatIcon
          key={i}
          deg={boat.heading}
          color={boat.color ?? "#0f3d3e"}
          label={boat.label}
          dashed={boat.dashed}
        />
      ))}
    </svg>
  );
}
