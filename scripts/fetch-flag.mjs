// Fetches the live conditions flag from Milwaukee Community Sailing Center's
// own weather worker (server-side, so no browser CORS restriction applies)
// and writes a small snapshot into public/ for the deployed app to read at
// runtime. Run on a schedule by .github/workflows/update-flag.yml — a
// failed or malformed fetch just leaves the previous snapshot in place
// rather than overwriting it with bad data; the app treats an old
// `fetchedAt` as staleness on its own.
import { writeFileSync } from "node:fs";

const SOURCE_URL = "https://weatherflag.milwaukee-community-sailing-center.workers.dev/";
const OUT_PATH = new URL("../public/flag-status.json", import.meta.url);
const VALID_COLORS = new Set(["White", "Yellow", "Green", "Black"]);

async function main() {
  let data;
  try {
    const res = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error("Fetch failed, leaving existing snapshot in place:", err instanceof Error ? err.message : err);
    return;
  }

  if (!data || !VALID_COLORS.has(data.flagColor)) {
    console.error("Unexpected response shape, leaving existing snapshot in place:", JSON.stringify(data));
    return;
  }

  const snapshot = {
    flagColor: data.flagColor,
    windSpeed: data.windSpeed ?? null,
    windDirection: data.windDirection ?? null,
    sourceUpdateDate: data.updateDate ?? null,
    notes: data.notes ?? null,
    fetchedAt: new Date().toISOString(),
  };

  writeFileSync(OUT_PATH, JSON.stringify(snapshot, null, 2) + "\n");
  console.log("Wrote flag-status.json:", snapshot);
}

main();
