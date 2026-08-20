import { Link, useNavigate } from "react-router-dom";
import { VISIBLE_TOPICS as TOPICS } from "../data/topics";
import { GAMES } from "../data/games";
import { QUESTIONS } from "../data/questions";
import { useQuizProgress } from "../hooks/useQuizProgress";
import { DIAGRAM_TYPES, dedupeCrossTopic } from "./Quiz";
import FlagStatus from "../components/FlagStatus";
import styles from "./Home.module.css";

const RESOURCE_LINKS = [
  {
    label: "Current Conditions Flag — Milwaukee Community Sailing Center",
    blurb: "The live white/yellow/green/black flag status this app's widget above is sourced from.",
    href: "https://sailingcenter.org/current-flag/",
  },
  {
    label: "US Sailing",
    blurb: "The national governing body behind the Basic Keelboat certification.",
    href: "https://www.ussailing.org/",
  },
  {
    label: "NWS Marine Forecast",
    blurb: "National Weather Service marine and small craft forecasts.",
    href: "https://www.weather.gov/marine/",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { progress, resetProgress } = useQuizProgress();

  const missedCount = progress.missed.length;
  const totalAttempted = Object.values(progress.scores).reduce((sum, s) => sum + (s?.attempted ?? 0), 0);
  // Counts must match what the quiz pool actually contains once cross-topic
  // duplicates (see dedupeCrossTopic in Quiz.tsx) are collapsed.
  const diagramCount = dedupeCrossTopic(QUESTIONS.filter((q) => DIAGRAM_TYPES.has(q.type))).length;
  const skipperCount = dedupeCrossTopic(QUESTIONS.filter((q) => q.type === "skipperView")).length;

  function startQuiz(topic: string) {
    navigate(`/quiz?topic=${topic}`);
  }

  function reviewMissed() {
    navigate(`/quiz?mode=missed`);
  }

  function startDiagramsQuiz() {
    navigate(`/quiz?mode=diagrams`);
  }

  function startSkipperQuiz() {
    navigate(`/quiz?mode=skipperView`);
  }

  return (
    <div className="container">
      <div className={styles.hero}>
        <h1>Basic Keelboat Study</h1>
        <p>Points of sail, tacking &amp; jibing, and everything else for the US Sailing evaluation.</p>
      </div>

      <FlagStatus />

      <section className={`card ${styles.section}`}>
        <div className={styles.sectionTitle}>Your progress</div>
        {totalAttempted === 0 ? (
          <div className={styles.emptyState}>No quiz attempts yet — start below to build up your score.</div>
        ) : (
          <>
            {TOPICS.map((topic) => {
              const stats = progress.scores[topic.id];
              const attempted = stats?.attempted ?? 0;
              const pct = attempted > 0 ? Math.round(((stats?.correct ?? 0) / attempted) * 100) : null;
              return (
                <div className={styles.progressRow} key={topic.id}>
                  <span className={styles.progressLabel}>{topic.title}</span>
                  <span className={styles.progressTrack}>
                    <span className={styles.progressFill} style={{ width: `${pct ?? 0}%` }} />
                  </span>
                  <span className={styles.progressPct}>{pct === null ? "—" : `${pct}%`}</span>
                </div>
              );
            })}
            <button className="btn" onClick={resetProgress} style={{ marginTop: 8 }}>
              Reset progress
            </button>
          </>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>Quiz</div>
        <div className={styles.quizButtons}>
          <button className="btn btn-primary btn-block" onClick={() => startQuiz("all")}>
            Quiz me on everything ({QUESTIONS.length} questions)
          </button>
          <button className="btn btn-block" onClick={startDiagramsQuiz}>
            Diagrams only — points of sail, turning, telltales ({diagramCount} questions)
          </button>
          <button className="btn btn-block" onClick={startSkipperQuiz}>
            Wind indicator practice — every point of sail, both tacks ({skipperCount} questions)
          </button>
          {missedCount > 0 && (
            <button className="btn btn-block" onClick={reviewMissed}>
              Review missed questions ({missedCount})
            </button>
          )}
          <details>
            <summary style={{ cursor: "pointer", color: "var(--teal)", fontWeight: "bold", fontSize: "0.9rem" }}>
              Quiz on a specific topic
            </summary>
            <div className={styles.quizButtons} style={{ marginTop: 10 }}>
              {TOPICS.map((topic) => (
                <button key={topic.id} className="btn" onClick={() => startQuiz(topic.id)}>
                  {topic.title}
                </button>
              ))}
            </div>
          </details>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>Games</div>
        <div className={styles.topicGrid}>
          {GAMES.map((game) => (
            <Link key={game.id} to={`/games/${game.id}`} className={`card ${styles.topicCard}`}>
              <h3>{game.title}</h3>
              <p>{game.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>Reference</div>
        <div className={styles.topicGrid}>
          {TOPICS.map((topic) => (
            <Link key={topic.id} to={`/reference/${topic.id}`} className={`card ${styles.topicCard}`}>
              <h3>{topic.title}</h3>
              <p>{topic.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>Resources</div>
        <div className={styles.quizButtons}>
          {RESOURCE_LINKS.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className={`card ${styles.topicCard}`}>
              <h3>{link.label}</h3>
              <p>{link.blurb}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
