/**
 * "Skipper's-eye view" — what you'd see looking forward from the tiller,
 * as opposed to PointsOfSailDiagram's aerial wheel. The boat itself stays
 * fixed (bow always "up," since that's your own fixed reference sitting at
 * the helm); the wind indicator on the shroud swings around to show your
 * angle to the wind instead. Complements the wheel rather than replacing
 * it — same underlying wheel-degrees headings, different vantage point.
 */
const VIEW_W = 100;
const VIEW_H = 100;
const MAST_X = 50;
const MAST_Y = 40;
const INDICATOR_LEN = 34;

export interface SkipperPoint {
  id: string;
  name: string;
  heading: number;
  caption: string;
}

/**
 * Both tacks for every reach — port and starboard mirror images of each
 * other, and telling them apart is exactly the skill this diagram drills.
 * `name` matches POINT_OF_SAIL_CHOICES exactly (grading and the reference
 * cards both key off it); the tack only shows up in the caption.
 */
export const SKIPPER_VIEW_POINTS: SkipperPoint[] = [
  { id: "no-go", name: "Irons (No-Go Zone)", heading: 0, caption: "Points straight back at you — no power, sails luff." },
  {
    id: "close-reach-stbd",
    name: "Close Reach",
    heading: -45,
    caption: "Angled back — about halfway to perpendicular. (Starboard tack)",
  },
  {
    id: "close-reach-port",
    name: "Close Reach",
    heading: 45,
    caption: "Angled back — about halfway to perpendicular. (Port tack)",
  },
  {
    id: "beam-reach-stbd",
    name: "Beam Reach",
    heading: -90,
    caption: "Perpendicular — straight out to the side. (Starboard tack)",
  },
  {
    id: "beam-reach-port",
    name: "Beam Reach",
    heading: 90,
    caption: "Perpendicular — straight out to the side. (Port tack)",
  },
  {
    id: "broad-reach-stbd",
    name: "Broad Reach",
    heading: -135,
    caption: "Angled forward, past perpendicular. (Starboard tack)",
  },
  {
    id: "broad-reach-port",
    name: "Broad Reach",
    heading: 135,
    caption: "Angled forward, past perpendicular. (Port tack)",
  },
  { id: "run", name: "Run", heading: 180, caption: "Points straight forward, over the bow." },
];

function normalizeDeg(deg: number) {
  return (((deg + 180) % 360) + 360) % 360 - 180;
}

// Same hand-tuned stops as PointsOfSailDiagram's trimMagnitude — trimmed in
// tight near irons, progressively eased out to a run — kept local since
// this icon's hull is a different size than the wheel's boat icon.
const TRIM_STOPS: [number, number][] = [
  [0, 0],
  [45, 5],
  [90, 11],
  [135, 16],
  [180, 20],
];

function trimMagnitude(absNd: number) {
  for (let i = 1; i < TRIM_STOPS.length; i++) {
    const [x0, y0] = TRIM_STOPS[i - 1];
    const [x1, y1] = TRIM_STOPS[i];
    if (absNd <= x1) return y0 + ((absNd - x0) / (x1 - x0)) * (y1 - y0);
  }
  return TRIM_STOPS[TRIM_STOPS.length - 1][1];
}

export function SkipperViewIcon({ heading, className }: { heading: number; className?: string }) {
  const nd = normalizeDeg(heading);
  const rad = (nd * Math.PI) / 180;
  // Streams away from the wind source: 0 = straight aft, 90 = perpendicular, 180 = straight forward.
  const tipX = MAST_X + INDICATOR_LEN * Math.sin(rad);
  const tipY = MAST_Y + INDICATOR_LEN * Math.cos(rad);

  // Which side the sails belly out toward (leeward) — same side the boom
  // swings to. The helmsperson sits on the opposite (windward, higher) rail.
  const lean = nd > 0.5 ? 1 : nd < -0.5 ? -1 : 0;
  const windwardSide = -lean;
  const mag = trimMagnitude(Math.abs(nd));
  const jibOut = lean * mag * 0.55;
  const mainOut = lean * mag;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      {/* hull — fixed, bow always up; this is your own boat, seen from the tiller */}
      <path
        d="M 42,88 L 58,88 Q 61,74 50,62 Q 39,74 42,88 Z"
        fill="#e4ede8"
        stroke="#20302c"
        strokeWidth={1.5}
      />
      {/* mast-to-deck line and jib/mainsail, trimmed to match the wind angle */}
      <line x1={50} y1={62} x2={50} y2={40} stroke="#20302c" strokeWidth={1} opacity={0.5} />
      <path d={`M 50,64 Q ${(50 + jibOut).toFixed(1)},70 50,74`} fill="none" stroke="#20302c" strokeWidth={1.2} opacity={0.85} />
      <path d={`M 50,75 Q ${(50 + mainOut).toFixed(1)},80 50,86`} fill="none" stroke="#20302c" strokeWidth={1.2} opacity={0.85} />
      {/* helmsperson, seated on the windward (higher) rail */}
      <circle cx={50 + windwardSide * 7} cy={83} r={2.4} fill="#0f3d3e" stroke="#fff" strokeWidth={0.6}>
        <title>helmsperson</title>
      </circle>
      {/* mast, seen end-on */}
      <circle cx={MAST_X} cy={MAST_Y} r={2.2} fill="#20302c" />
      {/* wind indicator, streaming from the masthead/shroud */}
      <line x1={MAST_X} y1={MAST_Y} x2={tipX} y2={tipY} stroke="#c8973a" strokeWidth={2.2} strokeLinecap="round" />
      <circle cx={tipX} cy={tipY} r={2.4} fill="#c8973a" />
    </svg>
  );
}
