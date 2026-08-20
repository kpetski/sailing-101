import { useId } from "react";

/**
 * Wheel geometry + wind-angle math ported directly from the original
 * sailing-maneuvers.html reference implementation. Angles are "wheel degrees":
 * 0 = pointing dead upwind (into the No-Go Zone), positive = clockwise
 * (port tack side), negative = counter-clockwise (starboard tack side),
 * ±180 = dead downwind (run). (In a bow-up bird's-eye view, local +x is the
 * boat's own starboard side; rotating the bow clockwise swings the stern
 * around such that the wind ends up over the port side — hence positive
 * heading = port tack.)
 */
const VIEW_W = 400;
const VIEW_H = 340;
const CX = 200;
const CY = 185;
const WHEEL_R = 115;
const BOAT_R = 78;
const MARKER_R = 104;
const LABEL_R = 106;

function polarToXY(deg: number, radius: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function normalizeDeg(deg: number) {
  return (((deg + 180) % 360) + 360) % 360 - 180;
}

/**
 * How far the mainsail's camber control point swings out, by angle off the
 * wind (0 = irons, 180 = run). Hand-tuned at each named point of sail
 * rather than a smooth power curve — a curve steep enough to keep close
 * reach tucked inside the hull outline pushes the run-heading control
 * point so far out it loops back across the hull's own stroke, which reads
 * as a rendering glitch rather than "sails eased all the way out."
 */
const MAIN_TRIM_STOPS: [number, number][] = [
  [0, 0],
  [45, 5],
  [90, 11],
  [135, 16],
  [180, 20],
];

function trimMagnitude(absNd: number) {
  for (let i = 1; i < MAIN_TRIM_STOPS.length; i++) {
    const [x0, y0] = MAIN_TRIM_STOPS[i - 1];
    const [x1, y1] = MAIN_TRIM_STOPS[i];
    if (absNd <= x1) return y0 + ((absNd - x0) / (x1 - x0)) * (y1 - y0);
  }
  return MAIN_TRIM_STOPS[MAIN_TRIM_STOPS.length - 1][1];
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

/**
 * Simplified top-down hull: flat transom, curved bow — matching the
 * classroom whiteboard sketch rather than a detailed rigged boat. A mast
 * line splits the hull into the jib (forward) and mainsail (aft) zones,
 * each with a camber curve leaning to whichever side is leeward. The sails
 * sheet in tight near the No-Go Zone and progressively ease out (further
 * lateral swing) approaching a run, mirroring how you'd actually trim
 * them — not just a fixed lean. A small dot on the windward (higher) rail
 * marks the helmsperson's seat, the usual reference point for judging
 * which way to move the tiller.
 */
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
  // which side the sails belly out toward (leeward), in the boat's own local frame
  const lean = nd > 0.5 ? 1 : nd < -0.5 ? -1 : 0;
  const windwardSide = -lean;

  // Trimmed in tight (sails tucked inside the hull outline) near dead
  // upwind, easing progressively past the rail as you bear away — just
  // outside the hull by a beam reach, well outside by a broad reach, and
  // all the way out at a run.
  const mainMag = trimMagnitude(Math.abs(nd));
  const jibOut = lean * mainMag * 0.7;
  const mainOut = lean * mainMag;

  // Offset radially out from wheel center (not along the boat's own
  // heading) so labels clear the hull regardless of rotation — a beam
  // reach boat is "wide" in the tangential direction, which a
  // heading-relative offset doesn't account for.
  const labelPos = polarToXY(deg, LABEL_R);
  const labelAnchor = labelPos.x < CX - 2 ? "end" : labelPos.x > CX + 2 ? "start" : "middle";

  return (
    <>
      <g transform={`translate(${x},${y}) rotate(${rot})`}>
        <path
          d="M -8,11 L 8,11 Q 11,-3 0,-15 Q -11,-3 -8,11 Z"
          fill={color}
          stroke="#20302c"
          strokeWidth={1.2}
          strokeDasharray={dashed ? "2,2" : "0"}
        />
        {/* mast, dividing jib (forward) from mainsail (aft) */}
        <line x1={0} y1={-14} x2={0} y2={9} stroke="#20302c" strokeWidth={1} opacity={0.55} />
        {/* jib */}
        <path
          d={`M 0,-12 Q ${jibOut.toFixed(1)},-6 0,-2`}
          fill="none"
          stroke="#20302c"
          strokeWidth={1.3}
          opacity={0.85}
        />
        {/* mainsail */}
        <path
          d={`M 0,-1 Q ${mainOut.toFixed(1)},4 0,9`}
          fill="none"
          stroke="#20302c"
          strokeWidth={1.3}
          opacity={0.85}
        />
        {/* helmsperson, seated on the windward (higher) rail */}
        <circle cx={windwardSide * 5} cy={7} r={2} fill="#0f3d3e" stroke="#fff" strokeWidth={0.6}>
          <title>helmsperson</title>
        </circle>
      </g>
      {label && (
        <text
          x={labelPos.x}
          y={labelPos.y + 4}
          fontSize={11}
          fill="#20302c"
          textAnchor={labelAnchor}
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
        y2={CY - WHEEL_R - 8}
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
