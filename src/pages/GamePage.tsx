import { Link, Navigate, useParams } from "react-router-dom";
import { GAME_MAP, type GameId } from "../data/games";
import { TOPIC_MAP } from "../data/topics";
import DirectionDrill from "../components/DirectionDrill";
import ManeuverGame from "../components/ManeuverGame";

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const game = gameId ? GAME_MAP[gameId as GameId] : undefined;

  if (!game) return <Navigate to="/" replace />;

  return (
    <div className="container">
      <div style={{ marginBottom: 6 }}>
        <h1>{game.title}</h1>
      </div>
      <p style={{ color: "var(--muted)", fontStyle: "italic", marginBottom: 20 }}>{game.blurb}</p>

      {game.id === "directionDrill" && <DirectionDrill />}
      {game.id === "maneuverPractice" && <ManeuverGame />}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          Need a refresher first?
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {game.relatedTopics.map((t) => (
            <Link key={t} className="btn" to={`/reference/${t}`}>
              Review {TOPIC_MAP[t].title}
            </Link>
          ))}
        </div>
      </div>

      <Link className="btn" to="/">
        Back home
      </Link>
    </div>
  );
}
