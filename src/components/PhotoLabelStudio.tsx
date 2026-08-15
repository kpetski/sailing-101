import { useEffect, useState, type MouseEvent } from "react";
import { shuffle } from "../lib/shuffle";

interface PhotoPoint {
  x: number; // percent, 0-100
  y: number; // percent, 0-100
}

type PointsMap = Record<string, PhotoPoint>;
type Mode = "calibrate" | "practice" | "match";

/**
 * Dev-only: lets you calibrate hotspots on your own photo (saved to
 * local-assets/, gitignored) and then study against it. Renders nothing at
 * all in production, and nothing until it confirms the photo file exists —
 * see vite.config.ts's localAssetsPlugin for why this can never leak into
 * the deployed build.
 */
export default function PhotoLabelStudio({
  variant,
  terms,
}: {
  variant: "hull" | "rig";
  terms: { id: string; term: string; definition: string }[];
}) {
  const photoUrl = `/__local__/${variant}.jpg`;
  const pointsUrl = `/__local__/${variant}-points.json`;

  const [photoOk, setPhotoOk] = useState<boolean | null>(null);
  const [points, setPoints] = useState<PointsMap>({});
  const [mode, setMode] = useState<Mode>("calibrate");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // matching-mode state
  const [wordBank, setWordBank] = useState<string[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);

  // practice-mode state
  const [revealedId, setRevealedId] = useState<string | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      setPhotoOk(false);
      return;
    }
    fetch(photoUrl, { method: "HEAD" })
      .then((r) => setPhotoOk(r.ok))
      .catch(() => setPhotoOk(false));
  }, [photoUrl]);

  useEffect(() => {
    if (!photoOk) return;
    fetch(pointsUrl)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: PointsMap) => {
        setPoints(data);
        const unplaced = terms.find((t) => !data[t.id]);
        setPendingId(unplaced?.id ?? null);
      })
      .catch(() => setPoints({}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoOk, pointsUrl]);

  const termFor = (id: string) => terms.find((t) => t.id === id)?.term ?? id;
  const defFor = (id: string) => terms.find((t) => t.id === id)?.definition ?? "";
  const allPlaced = terms.length > 0 && terms.every((t) => points[t.id]);

  function handleImageClick(e: MouseEvent<HTMLDivElement>) {
    if (mode !== "calibrate" || !pendingId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPoints((prev) => {
      const next = { ...prev, [pendingId]: { x, y } };
      const unplaced = terms.find((t) => !next[t.id]);
      setPendingId(unplaced?.id ?? null);
      return next;
    });
    setSaveStatus("idle");
  }

  async function savePoints() {
    setSaveStatus("saving");
    try {
      const res = await fetch("/__local__/save-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: `${variant}-points.json`, points }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    }
  }

  function startMatch() {
    setWordBank(shuffle(terms.map((t) => t.id)));
    setMatchedIds([]);
    setSelectedId(null);
    setWrongId(null);
    setMode("match");
  }

  function selectPin(id: string) {
    if (mode === "practice") {
      setRevealedId(id);
      return;
    }
    if (mode === "match" && !matchedIds.includes(id)) {
      setSelectedId(id);
    }
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

  if (photoOk === null || !photoOk) return null;

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        Your photo — local only, never deployed
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <button className="btn" disabled={mode === "calibrate"} onClick={() => setMode("calibrate")}>
          Calibrate
        </button>
        <button
          className="btn"
          disabled={mode === "practice" || !allPlaced}
          onClick={() => {
            setRevealedId(null);
            setMode("practice");
          }}
        >
          Practice
        </button>
        <button className="btn" disabled={mode === "match" || !allPlaced} onClick={startMatch}>
          Match
        </button>
      </div>

      <div
        style={{ position: "relative", cursor: mode === "calibrate" && pendingId ? "crosshair" : "default" }}
        onClick={handleImageClick}
      >
        <img src={photoUrl} alt="" style={{ width: "100%", display: "block", borderRadius: 8 }} />
        {Object.entries(points).map(([id, pt]) => {
          const isMatched = mode === "match" && matchedIds.includes(id);
          const isSelected = mode === "match" && selectedId === id;
          const isRevealed = mode === "practice" && revealedId === id;
          const isPending = mode === "calibrate" && pendingId === id;
          const showText = isMatched || isRevealed;
          const bg = showText ? "#1f6f6b" : isSelected || isPending ? "#b5533c" : "#c8973a";
          return (
            <button
              key={id}
              onClick={(e) => {
                e.stopPropagation();
                if (mode === "calibrate") {
                  setPendingId(id);
                } else {
                  selectPin(id);
                }
              }}
              style={{
                position: "absolute",
                left: `${pt.x}%`,
                top: `${pt.y}%`,
                transform: "translate(-50%, -50%)",
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: bg,
                border: "2px solid #fff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                cursor: "pointer",
                padding: 0,
              }}
              title={mode === "calibrate" ? termFor(id) : undefined}
            />
          );
        })}
        {Object.entries(points)
          .filter(([id]) => (mode === "match" && matchedIds.includes(id)) || (mode === "practice" && revealedId === id))
          .map(([id, pt]) => (
            <span
              key={`label-${id}`}
              style={{
                position: "absolute",
                left: `${pt.x}%`,
                top: `${pt.y}%`,
                transform: pt.x > 60 ? "translate(-100%, -140%)" : "translate(0, -140%)",
                background: "#fffdf7",
                border: "1px solid #c9bfa5",
                borderRadius: 6,
                padding: "2px 8px",
                fontSize: 12,
                fontWeight: "bold",
                color: "#0f3d3e",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {termFor(id)}
            </span>
          ))}
      </div>

      {mode === "calibrate" && (
        <div style={{ marginTop: 10 }}>
          <div className="callout" style={{ marginBottom: 10 }}>
            {pendingId
              ? `Click on the photo where "${termFor(pendingId)}" points to.`
              : "All parts placed! Click any pin to move it, or save below."}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {terms.map((t) => (
              <button
                key={t.id}
                className="btn"
                style={{
                  opacity: pendingId === t.id ? 1 : points[t.id] ? 0.6 : 0.9,
                  borderColor: pendingId === t.id ? "var(--rust)" : undefined,
                }}
                onClick={() => setPendingId(t.id)}
              >
                {points[t.id] ? "✓ " : ""}
                {t.term}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={savePoints} disabled={saveStatus === "saving"}>
            {saveStatus === "saving" ? "Saving…" : "Save to disk"}
          </button>
          {saveStatus === "saved" && (
            <span style={{ marginLeft: 10, color: "var(--good)" }}>
              Saved to local-assets/{variant}-points.json
            </span>
          )}
          {saveStatus === "error" && (
            <span style={{ marginLeft: 10, color: "var(--bad)" }}>Save failed — is `npm run dev` running?</span>
          )}
        </div>
      )}

      {mode === "practice" && (
        <div className="callout" style={{ marginTop: 10 }}>
          {revealedId ? (
            <>
              <b>{termFor(revealedId)}</b> — {defFor(revealedId)}
            </>
          ) : (
            "Tap a pin to reveal what that part is called."
          )}
        </div>
      )}

      {mode === "match" && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--muted)", marginBottom: 8 }}>
            <span>
              {selectedId ? "Point selected — pick its name below." : matchedIds.length === terms.length ? "All matched!" : "Tap a pin, then tap its name below."}
            </span>
            <span>
              {matchedIds.length} / {terms.length}
            </span>
          </div>
          {matchedIds.length === terms.length ? (
            <div style={{ textAlign: "center", fontWeight: "bold", color: "var(--good)" }}>Nice work — every part matched. 🎉</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {wordBank.map((id) => {
                const isMatched = matchedIds.includes(id);
                const isWrong = wrongId === id;
                return (
                  <button
                    key={id}
                    className="btn"
                    disabled={isMatched}
                    onClick={() => attemptTerm(id)}
                    style={{
                      background: isMatched ? "#e4f0ec" : isWrong ? "#f6e8e3" : undefined,
                      borderColor: isMatched ? "var(--good)" : isWrong ? "var(--bad)" : undefined,
                      color: isMatched ? "var(--good)" : isWrong ? "var(--bad)" : undefined,
                      opacity: isMatched ? 0.7 : 1,
                    }}
                  >
                    {termFor(id)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
