import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { TOPIC_MAP } from "../data/topics";
import { TERMS } from "../data/terms";
import type { TopicId } from "../data/types";
import PointsOfSailDiagram from "../components/PointsOfSailDiagram";
import LabelDiagram, { HULL_LABEL_POINTS, RIG_LABEL_POINTS, type LabelPoint } from "../components/LabelDiagram";
import PhotoLabelStudio from "../components/PhotoLabelStudio";
import { SkipperViewIcon, SKIPPER_VIEW_POINTS } from "../components/SkipperView";
import { shuffle } from "../lib/shuffle";
import styles from "./TopicReference.module.css";

function pointsToTerms(points: LabelPoint[]) {
  return points
    .map((p) => TERMS.find((t) => t.id === p.id))
    .filter((t): t is (typeof TERMS)[number] => Boolean(t));
}

const POINTS_OF_SAIL_OVERVIEW = [
  { heading: 0, color: "#a9c9c2", label: "Irons" },
  { heading: -45, color: "#7fb3ab", label: "Close Reach" },
  { heading: 45, color: "#7fb3ab", label: "Close Reach" },
  { heading: -90, color: "#7fb3ab", label: "Beam Reach" },
  { heading: 90, color: "#7fb3ab", label: "Beam Reach" },
  { heading: -135, color: "#3f5c56", label: "Broad Reach" },
  { heading: 135, color: "#3f5c56", label: "Broad Reach" },
  { heading: 180, color: "#3f5c56", label: "Run" },
];

function TillerReference() {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        Tiller quick reference
      </div>
      <div className={styles.tillerRow}>
        <span className={`pill ${styles.tillerTag}`} style={{ background: "var(--deep)" }}>
          Head Up
        </span>
        <span>
          <b>Push the tiller away</b> from you (toward leeward/the sail) → bow turns toward the wind.
        </span>
      </div>
      <div className={styles.tillerRow}>
        <span className={`pill ${styles.tillerTag}`} style={{ background: "var(--gold)" }}>
          Fall Off
        </span>
        <span>
          <b>Pull the tiller in</b> toward you (toward windward) → bow turns away from the wind.
        </span>
      </div>
      <div className="callout">
        This assumes you're sitting on the windward (higher, wind-hitting) side — the usual spot. It's the
        same push-opposite/pull-same rule as normal steering: tiller motion is always opposite the direction
        you want the bow to go. Heading up and falling off are just small versions of that. A <b>tack</b> is
        the same push (away from you, toward the sail) as heading up — just held hard over, all the way
        through the wind, instead of a small nudge.
      </div>
    </div>
  );
}

function TelltaleReference() {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        Reading jib telltales
      </div>
      <div className={styles.ttGrid}>
        <div className={styles.ttExample}>
          <svg viewBox="0 0 100 90" className={styles.ttSvg}>
            <polygon points="50,6 80,80 50,64 20,80" fill="#e4ede8" stroke="#20302c" strokeWidth={1.5} />
            <line x1={42} y1={18} x2={42} y2={34} stroke="#2f7d8c" strokeWidth={1.8} />
            <line x1={58} y1={18} x2={58} y2={34} stroke="#2f7d8c" strokeWidth={1.8} />
          </svg>
          <div className={styles.ttLabel} style={{ color: "var(--good)" }}>
            Streaming straight back
          </div>
          <div className={styles.ttCaption}>Both telltales flowing aft = well trimmed.</div>
        </div>
        <div className={styles.ttExample}>
          <svg viewBox="0 0 100 90" className={styles.ttSvg}>
            <polygon points="50,6 80,80 50,64 20,80" fill="#e4ede8" stroke="#20302c" strokeWidth={1.5} />
            <path d="M42,18 Q30,20 26,10" fill="none" stroke="#b5533c" strokeWidth={1.8} />
            <line x1={58} y1={18} x2={58} y2={34} stroke="#2f7d8c" strokeWidth={1.8} />
          </svg>
          <div className={styles.ttLabel} style={{ color: "var(--bad)" }}>
            Inner one flutters/lifts
          </div>
          <div className={styles.ttCaption}>Pointed too close to the wind (pinching). Fall off, or ease the sheet.</div>
        </div>
        <div className={styles.ttExample}>
          <svg viewBox="0 0 100 90" className={styles.ttSvg}>
            <polygon points="50,6 80,80 50,64 20,80" fill="#e4ede8" stroke="#20302c" strokeWidth={1.5} />
            <line x1={42} y1={18} x2={42} y2={34} stroke="#2f7d8c" strokeWidth={1.8} />
            <path d="M58,18 Q70,20 74,10" fill="none" stroke="#b5533c" strokeWidth={1.8} />
          </svg>
          <div className={styles.ttLabel} style={{ color: "var(--bad)" }}>
            Outer one flutters/lifts
          </div>
          <div className={styles.ttCaption}>Sail too loose, or turned too far from the wind. Trim in, or head up.</div>
        </div>
      </div>
      <div className="callout">
        Telltale = a small piece of yarn/ribbon on each side of the jib, near the front (luff). Reading them
        answers one of your <b>three key questions</b>: "are my sails trimmed properly?" This is different
        from the gold <b>wind indicator</b> on the shroud/mast, which shows your angle to the wind — straight
        back near irons, straight out to the side near beam reach.
      </div>
    </div>
  );
}

/** Same polar layout PointsOfSailDiagram's wheel uses: 0 = top, positive = clockwise. */
function wheelPos(heading: number, radiusPct: number) {
  const rad = ((heading - 90) * Math.PI) / 180;
  return { left: `${50 + radiusPct * Math.cos(rad)}%`, top: `${50 + radiusPct * Math.sin(rad)}%` };
}

function SkipperViewReference() {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        The skipper's view — your wind indicator, point by point
      </div>
      <div className={styles.skipperWheel}>
        <div className={styles.skipperWheelCenter}>Position around the circle matches the wheel diagram above.</div>
        {SKIPPER_VIEW_POINTS.map((p) => (
          <div className={styles.skipperWheelItem} key={p.id} style={wheelPos(p.heading, 38)}>
            <SkipperViewIcon heading={p.heading} className={styles.ttSvg} />
            <div className={styles.ttLabel}>{p.name}</div>
          </div>
        ))}
      </div>
      <div className="callout">
        This is the gold wind indicator up on the shroud/mast, seen from where you sit at the tiller — the
        boat stays put; the indicator swings around to show your angle to the wind. To point higher (indicator
        swings toward straight-back), <b>push the tiller away</b> from you. To fall off (indicator swings
        toward straight-forward), <b>pull the tiller toward you</b>. Full rule on the{" "}
        <Link to="/reference/tackingJibing">Tacking vs. Jibing</Link> page.
      </div>
    </div>
  );
}

function LabelPractice({ variant, points }: { variant: "hull" | "rig"; points: LabelPoint[] }) {
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const revealedTerm = revealedId ? TERMS.find((t) => t.id === revealedId) : undefined;

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        Label the parts — tap a dot
      </div>
      <div className={styles.diagramWrap}>
        <LabelDiagram
          variant={variant}
          points={points}
          revealedIds={revealedId ? [revealedId] : []}
          labelFor={(id) => TERMS.find((t) => t.id === id)?.term ?? id}
          onPointClick={(id) => setRevealedId(id)}
        />
      </div>
      <div className="callout" style={{ marginTop: 10 }}>
        {revealedTerm ? (
          <>
            <b>{revealedTerm.term}</b> — {revealedTerm.definition}
          </>
        ) : (
          "Tap any dot on the diagram to reveal what that part is called."
        )}
      </div>
    </div>
  );
}

function LabelMatchGame({ variant, points }: { variant: "hull" | "rig"; points: LabelPoint[] }) {
  const [wordBank, setWordBank] = useState(() => shuffle(points.map((p) => p.id)));
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);

  const termFor = (id: string) => TERMS.find((t) => t.id === id)?.term ?? id;
  const done = matchedIds.length === points.length;

  function selectPoint(id: string) {
    if (matchedIds.includes(id)) return;
    setSelectedId(id);
  }

  function attemptTerm(termId: string) {
    if (!selectedId || matchedIds.includes(termId)) return;
    if (termId === selectedId) {
      setMatchedIds((prev) => [...prev, selectedId]);
      setSelectedId(null);
      setWrongId(null);
    } else {
      setWrongId(termId);
      setTimeout(() => setWrongId((cur) => (cur === termId ? null : cur)), 400);
    }
  }

  function reset() {
    setWordBank(shuffle(points.map((p) => p.id)));
    setMatchedIds([]);
    setSelectedId(null);
    setWrongId(null);
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        Match all the labels
      </div>
      <div className={styles.diagramWrap}>
        <LabelDiagram
          variant={variant}
          points={points}
          matchedIds={matchedIds}
          selectedId={selectedId ?? undefined}
          showNumbers
          labelFor={termFor}
          onPointClick={selectPoint}
        />
      </div>
      <div className={styles.matchProgress}>
        <span>
          {selectedId
            ? `Point selected — pick its name below.`
            : done
              ? "All matched!"
              : "Tap a lettered point, then tap its name below."}
        </span>
        <span>
          {matchedIds.length} / {points.length}
        </span>
      </div>
      {done ? (
        <div className={styles.matchDone}>Nice work — every part matched. 🎉</div>
      ) : (
        <div className={styles.wordBank}>
          {wordBank.map((id) => {
            const isMatched = matchedIds.includes(id);
            const isWrong = wrongId === id;
            const cls = [styles.wordChip, isMatched && styles.matched, isWrong && styles.wrong]
              .filter(Boolean)
              .join(" ");
            return (
              <button key={id} className={cls} disabled={isMatched} onClick={() => attemptTerm(id)}>
                {termFor(id)}
              </button>
            );
          })}
        </div>
      )}
      <button className="btn" style={{ marginTop: 12 }} onClick={reset}>
        Reset
      </button>
    </div>
  );
}

export default function TopicReference() {
  const { topicId } = useParams<{ topicId: string }>();
  const topic = topicId ? TOPIC_MAP[topicId as TopicId] : undefined;

  if (!topic) return <Navigate to="/" replace />;

  const terms = TERMS.filter((t) => t.topic === topic.id);

  return (
    <div className="container">
      <div className={styles.header}>
        <h1>{topic.title}</h1>
      </div>
      <p className={styles.blurb}>{topic.blurb}</p>

      {topic.id === "pointsOfSail" && (
        <div className={styles.diagramWrap}>
          <PointsOfSailDiagram boats={POINTS_OF_SAIL_OVERVIEW} />
        </div>
      )}

      {topic.id === "nomenclature" && (
        <>
          <PhotoLabelStudio variant="hull" terms={pointsToTerms(HULL_LABEL_POINTS)} />
          <LabelPractice variant="hull" points={HULL_LABEL_POINTS} />
          <LabelMatchGame variant="hull" points={HULL_LABEL_POINTS} />
        </>
      )}
      {topic.id === "rig" && (
        <>
          <PhotoLabelStudio variant="rig" terms={pointsToTerms(RIG_LABEL_POINTS)} />
          <LabelPractice variant="rig" points={RIG_LABEL_POINTS} />
          <LabelMatchGame variant="rig" points={RIG_LABEL_POINTS} />
        </>
      )}
      {topic.id === "tackingJibing" && <TillerReference />}
      {topic.id === "sailTrim" && (
        <>
          <TelltaleReference />
          <SkipperViewReference />
        </>
      )}

      <dl className={styles.termList}>
        {terms.map((term) => (
          <div className={`card ${styles.termCard}`} key={term.id}>
            <dt>{term.term}</dt>
            <dd>{term.definition}</dd>
          </div>
        ))}
      </dl>

      <div style={{ display: "flex", gap: 10 }}>
        <Link className="btn btn-primary" to={`/quiz?topic=${topic.id}`}>
          Quiz me on this topic
        </Link>
        <Link className="btn" to="/">
          Back home
        </Link>
      </div>
    </div>
  );
}
