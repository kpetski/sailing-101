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
  { id: "bow", x: 404, y: 114 },
  { id: "stern", x: 72, y: 106 },
  { id: "deck", x: 335, y: 93 },
  { id: "cabin-trunk", x: 225, y: 62 },
  { id: "cockpit", x: 115, y: 96 },
  { id: "companionway", x: 172, y: 72 },
  { id: "tiller", x: 100, y: 122 },
  { id: "rudder", x: 76, y: 182 },
  { id: "keel", x: 210, y: 218 },
  { id: "hull", x: 260, y: 178 },
  { id: "transom", x: 70, y: 135 },
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

const HULL_VIEWBOX = "0 0 440 260";
const RIG_VIEWBOX = "0 0 300 380";

function HullArt() {
  return (
    <>
      <line x1={20} y1={175} x2={420} y2={175} stroke="#9ab3ab" strokeWidth={1} strokeDasharray="4,4" />
      <path
        d="M70,100 L70,170 C90,200 150,205 210,200 C270,205 330,195 370,165 L410,130 L395,100 L300,85 L160,82 Z"
        fill="#e4ede8"
        stroke="#20302c"
        strokeWidth={2}
      />
      <polygon points="185,198 235,198 220,240 200,240" fill="#3f5c56" stroke="#20302c" strokeWidth={1.5} />
      <polygon points="68,168 85,163 80,205 70,200" fill="#3f5c56" stroke="#20302c" strokeWidth={1.5} />
      <line x1={78} y1={140} x2={112} y2={120} stroke="#20302c" strokeWidth={3} strokeLinecap="round" />
      <polygon points="172,82 182,56 278,56 288,82" fill="#dcd3b8" stroke="#20302c" strokeWidth={1.5} />
      <rect x={164} y={58} width={16} height={24} fill="#8a8168" stroke="#20302c" strokeWidth={1} />
      <path d="M98,94 Q130,108 160,94" fill="none" stroke="#8a8168" strokeWidth={1.5} strokeDasharray="3,3" />
    </>
  );
}

function RigArt() {
  return (
    <>
      <path d="M40,335 Q150,355 260,335 L245,345 Q150,362 55,345 Z" fill="#e4ede8" stroke="#20302c" strokeWidth={2} />
      <line x1={150} y1={330} x2={150} y2={35} stroke="#20302c" strokeWidth={4} strokeLinecap="round" />
      <line x1={150} y1={40} x2={50} y2={335} stroke="#20302c" strokeWidth={2} />
      <line x1={150} y1={40} x2={250} y2={335} stroke="#20302c" strokeWidth={2} />
      <line x1={150} y1={112} x2={198} y2={335} stroke="#20302c" strokeWidth={1.6} />
      <line x1={138} y1={110} x2={162} y2={110} stroke="#20302c" strokeWidth={3} strokeLinecap="round" />
      <line x1={150} y1={325} x2={235} y2={325} stroke="#20302c" strokeWidth={3} strokeLinecap="round" />
      <polygon points="150,60 150,325 235,325" fill="#c8d9d2" fillOpacity={0.85} stroke="#1f6f6b" strokeWidth={1.5} />
      <polygon points="150,90 50,335 150,325" fill="#dbe6df" fillOpacity={0.85} stroke="#1f6f6b" strokeWidth={1.5} />
    </>
  );
}

export interface LabelDiagramProps {
  variant: "hull" | "rig";
  points: LabelPoint[];
  /** Quiz mode: only this point is shown, pulsing, unlabeled. */
  activeId?: string;
  /** Reference mode: ids whose term name is shown as a text label next to the dot. */
  revealedIds?: string[];
  onPointClick?: (id: string) => void;
  labelFor?: (id: string) => string;
  className?: string;
}

export default function LabelDiagram({
  variant,
  points,
  activeId,
  revealedIds,
  onPointClick,
  labelFor,
  className,
}: LabelDiagramProps) {
  const visiblePoints = activeId ? points.filter((p) => p.id === activeId) : points;

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
      {visiblePoints.map((p) => {
        const revealed = revealedIds?.includes(p.id);
        const isActive = activeId === p.id;
        return (
          <g key={p.id}>
            {isActive && (
              <circle cx={p.x} cy={p.y} r={13} fill="none" stroke="#b5533c" strokeWidth={2.5} opacity={0.6}>
                <animate attributeName="r" values="9;16;9" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0;0.7" dur="1.6s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={7}
              fill={revealed ? "#1f6f6b" : isActive ? "#b5533c" : "#c8973a"}
              stroke="#fff"
              strokeWidth={1.5}
              style={{ cursor: onPointClick ? "pointer" : "default" }}
              onClick={() => onPointClick?.(p.id)}
            />
            {revealed && labelFor && (
              <text
                x={p.x + 12}
                y={p.y + 4}
                fontSize={13}
                fontWeight="bold"
                fill="#0f3d3e"
                fontFamily="Georgia,serif"
                stroke="#f5f1e6"
                strokeWidth={3}
                paintOrder="stroke"
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
