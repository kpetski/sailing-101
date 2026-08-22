/**
 * Top-down "lake" diagram — a different vantage point from
 * PointsOfSailDiagram's wind-centered wheel. Boats sit at arbitrary
 * (x, y) positions rather than around a fixed radius, which is what
 * navigation ("get from here to that dock") and right-of-way ("which of
 * these two boats gives way") scenarios need that the wheel can't show.
 * Wind still blows straight down the canvas, same "0 = bow into the wind"
 * heading convention as the wheel, so the two diagrams read consistently.
 */
export const LAKE_VIEW_W = 520;
export const LAKE_VIEW_H = 360;

export const LAKE_PATH =
  "M 70,130 C 55,95 85,55 145,45 C 195,37 235,58 258,45 C 288,28 340,22 385,42 " +
  "C 435,63 478,78 486,118 C 493,152 465,172 458,198 C 450,228 480,248 468,278 " +
  "C 458,305 412,315 375,298 C 345,284 325,300 292,292 C 252,282 232,302 192,296 " +
  "C 148,289 128,262 96,266 C 66,270 42,242 47,204 C 50,180 32,164 37,142 C 40,128 55,128 70,130 Z";

// A path element used purely for its geometry (isPointInFill), kept out of
// view — lets scenario generators (Chart a Course) check a candidate point
// against the lake's actual irregular shape instead of a bounding box, so a
// "goal" mark can never land outside the drawn water. Chrome's isPointInFill
// silently returns wrong answers for a path that's never attached to the
// document (verified — a detached element reports every point as outside),
// so this has to actually live in the DOM; zero-size + absolute positioning
// keeps it from affecting layout or being visible.
let lakeGeometryPath: SVGPathElement | null = null;
function getLakeGeometryPath(): SVGPathElement | null {
  if (typeof document === "undefined") return null;
  if (!lakeGeometryPath) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    lakeGeometryPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    lakeGeometryPath.setAttribute("d", LAKE_PATH);
    svg.appendChild(lakeGeometryPath);
    document.body.appendChild(svg);
  }
  return lakeGeometryPath;
}

/** Whether (x,y), in the lake's own coordinate space, falls inside the drawn water shape. */
export function isInsideLake(x: number, y: number): boolean {
  const el = getLakeGeometryPath();
  if (!el || typeof el.isPointInFill !== "function") return true;
  try {
    return el.isPointInFill(new DOMPoint(x, y));
  } catch {
    return true;
  }
}

/** Like isInsideLake, but also requires clearance from the shoreline in every direction — keeps a mark/hazard from rendering right at the water's edge. */
export function isSafelyInsideLake(x: number, y: number, margin: number): boolean {
  if (!isInsideLake(x, y)) return false;
  const probes = 8;
  for (let i = 0; i < probes; i++) {
    const angle = (i / probes) * Math.PI * 2;
    if (!isInsideLake(x + margin * Math.cos(angle), y + margin * Math.sin(angle))) return false;
  }
  return true;
}

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

export interface LakeObstacle {
  x: number;
  y: number;
  r: number;
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

function Obstacle({ x, y, r }: LakeObstacle) {
  return <circle cx={x} cy={y} r={r} fill="url(#lakeHazardHatch)" stroke="#b5533c" strokeWidth={2} />;
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
  obstacles?: LakeObstacle[];
  className?: string;
}

export default function LakeMap({ boats, docks = [], marks = [], routes = [], obstacles = [], className }: LakeMapProps) {
  return (
    <svg
      viewBox={`0 0 ${LAKE_VIEW_W} ${LAKE_VIEW_H}`}
      className={className}
      style={{ display: "block", width: "100%", height: "auto", background: "#eee7d3", borderRadius: 8, border: "1px solid #c9bfa5" }}
    >
      <defs>
        <marker id="lakeWindHead" markerWidth={7} markerHeight={7} refX={5} refY={3.5} orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#b5533c" />
        </marker>
        <pattern id="lakeHazardHatch" width={6} height={6} patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width={6} height={6} fill="#f3d9d2" />
          <line x1={0} y1={0} x2={0} y2={6} stroke="#b5533c" strokeWidth={2} />
        </pattern>
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
      {obstacles.map((o, i) => (
        <Obstacle key={i} {...o} />
      ))}
      {boats.map((b, i) => (
        <LakeBoatIcon key={i} {...b} />
      ))}
    </svg>
  );
}
