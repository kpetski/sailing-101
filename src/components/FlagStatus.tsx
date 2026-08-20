import { useEffect, useState } from "react";
import styles from "./FlagStatus.module.css";

/**
 * Milwaukee Community Sailing Center's live conditions flag, rendered in our
 * own UI rather than embedding/linking their page. The color comes from a
 * static snapshot (public/flag-status.json) that a scheduled GitHub Action
 * refreshes server-side — sailingcenter.org's live data API only allows
 * CORS from their own origin, so a direct client-side fetch from this app
 * would be blocked by the browser every time. If the snapshot is missing,
 * malformed, or too old, this falls back to an "unknown" state rather than
 * showing stale/wrong data as if it were current.
 */

const STALE_AFTER_MS = 3 * 60 * 60 * 1000; // 3 hours

const FLAG_INFO: Record<string, { swatch: string; border: string; meaning: string }> = {
  White: { swatch: "#ffffff", border: "#8a8168", meaning: "Light Air — 0 to 10 knots" },
  Yellow: { swatch: "#e8c23a", border: "#a9862a", meaning: "Medium Air — 0 to 15 knots" },
  Green: { swatch: "#2f7a4f", border: "#1f5236", meaning: "Heavy Air — 0 to 20 knots" },
  Black: { swatch: "#1c2b30", border: "#000000", meaning: "No Sailing" },
};

interface Snapshot {
  flagColor: string;
  windSpeed: string | null;
  windDirection: string | null;
  sourceUpdateDate: string | null;
  notes: string | null;
  fetchedAt: string;
}

type State = { kind: "loading" } | { kind: "unknown" } | { kind: "ok"; data: Snapshot; stale: boolean };

export default function FlagStatus() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}flag-status.json`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: Snapshot) => {
        if (cancelled) return;
        if (!data?.flagColor || !FLAG_INFO[data.flagColor] || !data.fetchedAt) {
          setState({ kind: "unknown" });
          return;
        }
        const stale = Date.now() - new Date(data.fetchedAt).getTime() > STALE_AFTER_MS;
        setState({ kind: "ok", data, stale });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "unknown" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") return null;

  if (state.kind === "unknown") {
    return (
      <div className={`card ${styles.card}`}>
        <div className={styles.header}>
          <span className={`${styles.swatch} ${styles.swatchUnknown}`} />
          <div>
            <div className={styles.title}>MCSC Flag: Unknown</div>
            <div className={styles.meta}>
              Couldn't load the current status.{" "}
              <a href="https://sailingcenter.org/current-flag/" target="_blank" rel="noreferrer">
                Check the live page →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data, stale } = state;
  const info = FLAG_INFO[data.flagColor];

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.header}>
        <span className={styles.swatch} style={{ background: info.swatch, borderColor: info.border }} />
        <div>
          <div className={styles.title}>
            MCSC Flag: {data.flagColor}
            {stale && <span className={styles.staleBadge}>possibly stale</span>}
          </div>
          <div className={styles.meta}>{info.meaning}</div>
        </div>
      </div>
      {(data.windSpeed || data.windDirection) && (
        <div className={styles.detail}>
          Wind: {data.windSpeed ?? "—"} kts{data.windDirection ? `, ${data.windDirection}` : ""}
        </div>
      )}
      <div className={styles.footer}>
        <span>
          Milwaukee Community Sailing Center &middot; checked {new Date(data.fetchedAt).toLocaleString()}
        </span>
        <a href="https://sailingcenter.org/current-flag/" target="_blank" rel="noreferrer">
          Source →
        </a>
      </div>
    </div>
  );
}
