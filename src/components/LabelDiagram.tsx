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
  { id: "mast", x: 755, y: 480 },
  { id: "boom", x: 420, y: 968 },
  { id: "spreader", x: 700, y: 300 },
  { id: "mainsail", x: 480, y: 560 },
  { id: "jib", x: 860, y: 650 },
  { id: "forestay", x: 830, y: 330 },
  { id: "backstay", x: 420, y: 480 },
  { id: "shrouds", x: 620, y: 640 },
];

const HULL_VIEWBOX = "0 -200 500 470";
const RIG_VIEWBOX = "0 0 1201 1280";

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

      {/*
        Mast/boom/mainsail, added purely so this hull silhouette reads as a
        sailboat at a glance. Unlabeled here (no LabelPoint) — mast, boom,
        and mainsail are already labeled dots on the separate Rig page, so
        this is background context only, not a duplicate labeling target.
      */}
      <line x1={340} y1={-178} x2={486} y2={122} stroke="#20302c" strokeWidth={1.2} strokeDasharray="6,5" opacity={0.4} />
      <line x1={340} y1={-178} x2={78} y2={120} stroke="#20302c" strokeWidth={1.2} strokeDasharray="6,5" opacity={0.4} />
      <path
        d="M340,-172 L340,84 L206,84 Q252,-38 340,-172 Z"
        fill="#f5f1e6"
        stroke="#20302c"
        strokeWidth={1.5}
        strokeLinejoin="round"
        opacity={0.92}
      />
      <line x1={205} y1={87} x2={342} y2={87} stroke="#20302c" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={340} y1={84} x2={340} y2={-178} stroke="#20302c" strokeWidth={3.5} strokeLinecap="round" />
    </>
  );
}

/**
 * Real illustration (Pixabay Content License — free for public/commercial
 * use, no attribution required, modification/redistribution permitted;
 * https://pixabay.com/service/license-summary/), credited in README.md.
 * The source drawing doesn't include a spreader, backstay, or shrouds (it's
 * a simple daysailer rig), so those three are added here as an overlay in a
 * matching line style — everything else (mast, boom, mainsail, jib,
 * forestay) is the original illustration.
 */
function RigArt() {
  return (
    <>
      <image href={`${import.meta.env.BASE_URL}diagrams/sailboat-rig.png`} x={0} y={0} width={1201} height={1280} />
      {/* spreader — added: a strut crossing the mast partway up */}
      <line x1={655} y1={300} x2={855} y2={300} stroke="#20302c" strokeWidth={5} strokeLinecap="round" />
      {/* shroud — added: mast (at spreader height) down to a mid-deck chainplate; dashed to read as "behind" the sail */}
      <line x1={745} y1={305} x2={560} y2={975} stroke="#20302c" strokeWidth={2} strokeDasharray="10,6" opacity={0.75} />
      {/* backstay — added: masthead down to the stern; dashed to read as "behind" the sail */}
      <line x1={752} y1={30} x2={230} y2={945} stroke="#20302c" strokeWidth={2} strokeDasharray="10,6" opacity={0.75} />
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
  const viewBoxWidth = variant === "hull" ? 500 : 1201;

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
        {/* Letters, not numbers — the rig photo has its own baked-in numbered callouts (1-30) that digits would collide with. */}
        const marker = String.fromCharCode(65 + i);
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
                {marker}
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
