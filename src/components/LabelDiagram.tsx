/**
 * Original schematic sailboat art (side-profile hull + rig) for label-the-parts
 * practice and quiz questions. Not traced from any textbook image — just a
 * simplified, schematic sailboat silhouette, in the same "not to scale"
 * spirit as PointsOfSailDiagram.
 */
export interface LabelPoint {
  /** Matches a Term id in src/data/terms.ts. */
  id: string;
  x: number;
  y: number;
}

export const HULL_LABEL_POINTS: LabelPoint[] = [
  { id: "bow", x: 486, y: 122 },
  { id: "stern", x: 72, y: 118 },
  { id: "deck", x: 400, y: 92 },
  { id: "cabin-trunk", x: 245, y: 63 },
  { id: "cockpit", x: 130, y: 108 },
  { id: "companionway", x: 195, y: 68 },
  { id: "tiller", x: 102, y: 138 },
  { id: "rudder", x: 80, y: 198 },
  { id: "keel", x: 278, y: 228 },
  { id: "hull", x: 370, y: 172 },
  { id: "transom", x: 72, y: 148 },
];

export const RIG_LABEL_POINTS: LabelPoint[] = [
  { id: "mast", x: 150, y: 180 },
  { id: "boom", x: 195, y: 325 },
  { id: "spreader", x: 150, y: 110 },
  { id: "mainsail", x: 178, y: 230 },
  { id: "jib", x: 95, y: 265 },
  { id: "forestay", x: 96, y: 195 },
  { id: "backstay", x: 203, y: 195 },
  { id: "shrouds", x: 178, y: 260 },
];

const HULL_VIEWBOX = "0 0 500 270";
const RIG_VIEWBOX = "0 0 300 380";

function HullArt() {
  return (
    <>
      <line x1={20} y1={195} x2={480} y2={195} stroke="#9ab3ab" strokeWidth={1} strokeDasharray="4,4" />

      {/* Hull: near-vertical transom, curved belly, sharp pointed bow, level-ish sheer. */}
      <path
        d="M72,118
           L76,180
           Q150,204 280,206
           Q385,207 405,188
           L465,148
           L486,122
           L448,96
           Q310,80 160,86
           Q95,89 72,118
           Z"
        fill="#e4ede8"
        stroke="#20302c"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* fin keel */}
      <path d="M252,206 L312,208 L294,250 L268,248 Z" fill="#3f5c56" stroke="#20302c" strokeWidth={1.5} />

      {/* rudder, hung off the transom */}
      <path d="M66,180 L88,174 L84,220 L70,216 Z" fill="#3f5c56" stroke="#20302c" strokeWidth={1.5} />

      {/* tiller, from the rudder head forward into the cockpit */}
      <line x1={76} y1={158} x2={128} y2={130} stroke="#20302c" strokeWidth={3.5} strokeLinecap="round" />

      {/* cabin trunk, sitting on the foredeck */}
      <path d="M195,90 L206,56 L286,54 L300,91 Z" fill="#dcd3b8" stroke="#20302c" strokeWidth={1.5} strokeLinejoin="round" />
      {/* a couple of cabin-top hand rails / portlight hints for texture */}
      <line x1={218} y1={62} x2={278} y2={61} stroke="#8a8168" strokeWidth={1} strokeDasharray="2,3" />
      <circle cx={235} cy={72} r={4} fill="none" stroke="#8a8168" strokeWidth={1} />
      <circle cx={263} cy={72} r={4} fill="none" stroke="#8a8168" strokeWidth={1} />

      {/* companionway doorway at the aft face of the cabin trunk */}
      <rect x={186} y={60} width={17} height={31} fill="#5a5240" stroke="#20302c" strokeWidth={1} />

      {/* cockpit — shallow recessed well aft of the cabin trunk */}
      <path d="M100,102 Q150,128 195,92" fill="none" stroke="#8a8168" strokeWidth={1.5} strokeDasharray="3,3" />
    </>
  );
}

function RigArt() {
  return (
    <>
      <path d="M40,335 Q150,357 260,335 L246,347 Q150,364 54,347 Z" fill="#e4ede8" stroke="#20302c" strokeWidth={2} />
      <line x1={150} y1={330} x2={150} y2={35} stroke="#20302c" strokeWidth={4} strokeLinecap="round" />
      <line x1={150} y1={40} x2={50} y2={335} stroke="#20302c" strokeWidth={2} />
      <line x1={150} y1={40} x2={250} y2={335} stroke="#20302c" strokeWidth={2} />
      <line x1={150} y1={112} x2={198} y2={335} stroke="#20302c" strokeWidth={1.6} />
      <line x1={128} y1={104} x2={150} y2={110} stroke="#20302c" strokeWidth={3} strokeLinecap="round" />
      <line x1={150} y1={110} x2={172} y2={104} stroke="#20302c" strokeWidth={3} strokeLinecap="round" />
      <line x1={150} y1={325} x2={235} y2={325} stroke="#20302c" strokeWidth={3} strokeLinecap="round" />
      {/* mainsail, with a slightly curved (roached) leech rather than a straight line */}
      <path
        d="M150,60 C185,150 220,240 235,325 L150,325 Z"
        fill="#c8d9d2"
        fillOpacity={0.85}
        stroke="#1f6f6b"
        strokeWidth={1.5}
      />
      {/* jib, with a gently curved leech too */}
      <path
        d="M150,90 C120,175 85,260 50,335 L150,325 Z"
        fill="#dbe6df"
        fillOpacity={0.85}
        stroke="#1f6f6b"
        strokeWidth={1.5}
      />
    </>
  );
}

export interface LabelDiagramProps {
  variant: "hull" | "rig";
  points: LabelPoint[];
  /** Quiz "which part is this" mode: only this point is shown, pulsing, unlabeled. */
  activeId?: string;
  /** Reference mode: ids whose term name is shown as a text label next to the dot. */
  revealedIds?: string[];
  /** Matching-game mode: currently-selected (pending) point. */
  selectedId?: string;
  /** Matching-game mode: ids already matched correctly — styled like revealed. */
  matchedIds?: string[];
  /** Matching-game mode: render each point's 1-based position number instead of a plain dot. */
  showNumbers?: boolean;
  onPointClick?: (id: string) => void;
  labelFor?: (id: string) => string;
  className?: string;
}

export default function LabelDiagram({
  variant,
  points,
  activeId,
  revealedIds,
  selectedId,
  matchedIds,
  showNumbers,
  onPointClick,
  labelFor,
  className,
}: LabelDiagramProps) {
  const visiblePoints = activeId ? points.filter((p) => p.id === activeId) : points;
  const viewBoxWidth = variant === "hull" ? 500 : 300;

  return (
    <svg
      viewBox={variant === "hull" ? HULL_VIEWBOX : RIG_VIEWBOX}
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
      {variant === "hull" ? <HullArt /> : <RigArt />}
      {visiblePoints.map((p, i) => {
        const revealed = revealedIds?.includes(p.id) || matchedIds?.includes(p.id);
        const isActive = activeId === p.id;
        const isSelected = selectedId === p.id;
        const number = i + 1;
        const fill = revealed ? "#1f6f6b" : isActive || isSelected ? "#b5533c" : "#c8973a";
        return (
          <g key={p.id}>
            {(isActive || isSelected) && (
              <circle cx={p.x} cy={p.y} r={13} fill="none" stroke="#b5533c" strokeWidth={2.5} opacity={0.6}>
                <animate attributeName="r" values="9;17;9" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0;0.7" dur="1.6s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={showNumbers ? 10 : 7}
              fill={fill}
              stroke="#fff"
              strokeWidth={1.5}
              style={{ cursor: onPointClick ? "pointer" : "default" }}
              onClick={() => onPointClick?.(p.id)}
            />
            {showNumbers && !revealed && (
              <text
                x={p.x}
                y={p.y + 3.5}
                fontSize={10}
                fontWeight="bold"
                fill="#fff"
                textAnchor="middle"
                fontFamily="Georgia,serif"
                style={{ pointerEvents: "none" }}
              >
                {number}
              </text>
            )}
            {revealed && labelFor && (
              <text
                x={p.x > viewBoxWidth - 70 ? p.x - 13 : p.x + 13}
                y={p.y + 4}
                textAnchor={p.x > viewBoxWidth - 70 ? "end" : "start"}
                fontSize={13}
                fontWeight="bold"
                fill="#0f3d3e"
                fontFamily="Georgia,serif"
                stroke="#f5f1e6"
                strokeWidth={3}
                paintOrder="stroke"
                style={{ pointerEvents: "none" }}
              >
                {labelFor(p.id)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
