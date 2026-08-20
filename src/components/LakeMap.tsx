/**
 * Top-down "lake" diagram — a different vantage point from
 * PointsOfSailDiagram's wind-centered wheel. Boats sit at arbitrary
 * (x, y) positions rather than around a fixed radius, which is what
 * navigation ("get from here to that dock") and right-of-way ("which of
 * these two boats gives way") scenarios need that the wheel can't show.
 * Wind still blows straight down the canvas, same "0 = bow into the wind"
 * heading convention as the wheel, so the two diagrams read consistently.
 */
const VIEW_W = 520;
const VIEW_H = 360;

const LAKE_PATH =
  "M 70,130 C 55,95 85,55 145,45 C 195,37 235,58 258,45 C 288,28 340,22 385,42 " +
  "C 435,63 478,78 486,118 C 493,152 465,172 458,198 C 450,228 480,248 468,278 " +
  "C 458,305 412,315 375,298 C 345,284 325,300 292,292 C 252,282 232,302 192,296 " +
  "C 148,289 128,262 96,266 C 66,270 42,242 47,204 C 50,180 32,164 37,142 C 40,128 55,128 70,130 Z";

function normalizeDeg(deg: number) {
  return (((deg + 180) % 360) + 360) % 360 - 180;
}

export interface LakeBoat {
  x: number;
  y: number;
  heading: number;
  color?: string;
  label?: string;
  dashed?: boolean;
}

export interface LakeDock {
  x: number;
  y: number;
  /** Degrees, which way the dock points out from shore (0 = up). */
  angle: number;
  label?: string;
}

export interface LakeMark {
  x: number;
  y: number;
  label?: string;
}

export interface LakeRoute {
  points: [number, number][];
  color: string;
  label: string;
  dashed?: boolean;
}

function LakeBoatIcon({ x, y, heading, color = "#0f3d3e", label, dashed }: LakeBoat) {
  const nd = normalizeDeg(heading);
  const lean = nd > 0.5 ? 1 : nd < -0.5 ? -1 : 0;
  return (
    <g transform={`translate(${x},${y}) rotate(${heading})`}>
      <path
        d="M -7,9 L 7,9 Q 9,-3 0,-13 Q -9,-3 -7,9 Z"
        fill={color}
        stroke="#20302c"
        strokeWidth={1.2}
        strokeDasharray={dashed ? "2,2" : "0"}
      />
      <line x1={0} y1={-12} x2={0} y2={8} stroke="#20302c" strokeWidth={0.9} opacity={0.55} />
      <path d={`M 0,-2 Q ${lean * 8},3 0,8`} fill="none" stroke="#20302c" strokeWidth={1.1} opacity={0.85} />
      {label && (
        <text
          x={0}
          y={22}
          fontSize={12}
          fontWeight="bold"
          fill="#20302c"
          textAnchor="middle"
          fontFamily="Georgia,serif"
          transform={`rotate(${-heading})`}
        >
          {label}
        </text>
      )}
    </g>
  );
}

function Dock({ x, y, angle, label }: LakeDock) {
  return (
    <g transform={`translate(${x},${y}) rotate(${angle})`}>
      <rect x={-8} y={-26} width={16} height={26} fill="#8a4a3c" stroke="#20302c" strokeWidth={1.5} />
      {label && (
        <text
          x={0}
          y={-32}
          fontSize={12}
          fontWeight="bold"
          fill="#20302c"
          textAnchor="middle"
          fontFamily="Georgia,serif"
          transform={`rotate(${-angle})`}
        >
          {label}
        </text>
      )}
    </g>
  );
}

function Mark({ x, y, label }: LakeMark) {
  return (
    <>
      <circle cx={x} cy={y} r={6} fill="#c8973a" stroke="#20302c" strokeWidth={1.5} />
      {label && (
        <text x={x} y={y - 12} fontSize={12} fontWeight="bold" fill="#20302c" textAnchor="middle" fontFamily="Georgia,serif">
          {label}
        </text>
      )}
    </>
  );
}

/** Point at a given fraction of the way along a polyline's total length — a plain index pick lands on a vertex, not necessarily the visual middle (a 2-point straight line's "middle index" is one of its endpoints). */
function pointAlong(points: [number, number][], fraction: number): [number, number] {
  const segLens = points.slice(1).map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  const total = segLens.reduce((a, b) => a + b, 0);
  let target = total * fraction;
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i] || i === segLens.length - 1) {
      const t = segLens[i] === 0 ? 0 : target / segLens[i];
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
    }
    target -= segLens[i];
  }
  return points[0];
}

function Route({ points, color, label, dashed = true, labelFraction = 0.5 }: LakeRoute & { labelFraction?: number }) {
  const d = points.map(([px, py], i) => `${i === 0 ? "M" : "L"} ${px},${py}`).join(" ");
  const [lx, ly] = pointAlong(points, labelFraction);
  return (
    <>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray={dashed ? "7,5" : "0"}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
      <text
        x={lx}
        y={ly - 8}
        fontSize={12}
        fontWeight="bold"
        fill={color}
        textAnchor="middle"
        fontFamily="Georgia,serif"
        stroke="#f5f1e6"
        strokeWidth={3}
        paintOrder="stroke"
      >
        {label}
      </text>
    </>
  );
}

export interface LakeMapProps {
  boats: LakeBoat[];
  docks?: LakeDock[];
  marks?: LakeMark[];
  routes?: LakeRoute[];
  className?: string;
}

export default function LakeMap({ boats, docks = [], marks = [], routes = [], className }: LakeMapProps) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      style={{ display: "block", width: "100%", height: "auto", background: "#eee7d3", borderRadius: 8, border: "1px solid #c9bfa5" }}
    >
      <defs>
        <marker id="lakeWindHead" markerWidth={7} markerHeight={7} refX={5} refY={3.5} orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#b5533c" />
        </marker>
      </defs>

      {[70, 175, 280, 385, 460].map((wx) => (
        <line
          key={wx}
          x1={wx}
          y1={4}
          x2={wx}
          y2={26}
          stroke="#b5533c"
          strokeWidth={3.5}
          opacity={0.75}
          markerEnd="url(#lakeWindHead)"
        />
      ))}

      <path d={LAKE_PATH} fill="#c9dedb" stroke="#20302c" strokeWidth={2} strokeLinejoin="round" />

      {routes.map((r, i) => (
        <Route key={i} {...r} labelFraction={0.3 + i * 0.2} />
      ))}
      {docks.map((d, i) => (
        <Dock key={i} {...d} />
      ))}
      {marks.map((m, i) => (
        <Mark key={i} {...m} />
      ))}
      {boats.map((b, i) => (
        <LakeBoatIcon key={i} {...b} />
      ))}
    </svg>
  );
}
