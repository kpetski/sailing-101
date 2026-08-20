// Shared heading math for the boat-diagram games (Maneuver Practice, Navigate).
// Headings are in "wheel degrees": 0 = Irons (dead upwind), ±180 = Run (dead
// downwind), positive = Port Tack side, negative = Starboard Tack side.

export const PRESETS = [0, -45, 45, -90, 90, -135, 135, 180] as const;

const TRIM_STOPS: [number, number][] = [
  [0, 0],
  [45, 10],
  [90, 22],
  [135, 32],
  [180, 40],
];

export function trimMagnitude(absNd: number) {
  for (let i = 1; i < TRIM_STOPS.length; i++) {
    const [x0, y0] = TRIM_STOPS[i - 1];
    const [x1, y1] = TRIM_STOPS[i];
    if (absNd <= x1) return y0 + ((absNd - x0) / (x1 - x0)) * (y1 - y0);
  }
  return TRIM_STOPS[TRIM_STOPS.length - 1][1];
}

export function normalizeDeg(deg: number) {
  const n = (((deg + 180) % 360) + 360) % 360 - 180;
  // Keep dead-downwind headings at +180 rather than -180, so a fall-off from
  // a port-tack broad reach to a run doesn't look like it flipped tacks.
  return n === -180 ? 180 : n;
}

export function snapToPreset(deg: number): number {
  const n = deg === -180 ? 180 : deg;
  let best: number = PRESETS[0];
  let bestDiff = Infinity;
  for (const p of PRESETS) {
    const diff = Math.abs(n - p);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = p;
    }
  }
  return best;
}

/** -1/1 = which side the boom is blown out to (leeward); 0 = squared on a run/irons. */
export function leanOf(heading: number): -1 | 0 | 1 {
  const nd = normalizeDeg(heading);
  return nd > 0.5 ? 1 : nd < -0.5 ? -1 : 0;
}

/** The rail you'd sit on for a given heading — opposite the boom. 0 = either/centered. */
export function windwardOf(heading: number): -1 | 0 | 1 {
  const lean = leanOf(heading);
  return lean === 0 ? 0 : ((-lean) as -1 | 1);
}

export function headingName(h: number) {
  const abs = Math.abs(h);
  if (abs === 0) return "Irons";
  if (abs === 180) return "Run";
  const name = abs === 45 ? "Close Reach" : abs === 90 ? "Beam Reach" : "Broad Reach";
  const tack = h > 0 ? "Port Tack" : "Starboard Tack";
  return `${name}, ${tack}`;
}

/** The 6 real, sailable points of sail — Irons and Run excluded (see Navigate/Maneuver Practice). */
export const REAL_POINTS = [-135, -90, -45, 45, 90, 135] as const;

export type HeadingMoveResult = { ok: true; newHeading: number; label: string } | { ok: false; error: string };

/**
 * A move is a real single action: head up or fall off one point on the same
 * tack (tiller relative to the crew's current, unchanged side), or a tack/
 * jibe (crew already moved to the other side) — only possible from Close
 * Reach (tack) or Broad Reach (jibe), matching how those are actually done.
 * Shared by every "steer one move at a time" game (Navigate, Chart a Course).
 */
export function applyHeadingMove(currentHeading: number, tillerSide: -1 | 1, crewSide: -1 | 0 | 1): HeadingMoveResult {
  const windwardNow = windwardOf(currentHeading);
  const crossing = crewSide !== windwardNow;

  if (crossing) {
    if (Math.abs(currentHeading) === 45) {
      const newHeading = -currentHeading;
      return { ok: true, newHeading, label: `Tacked to ${headingName(newHeading)}` };
    }
    if (Math.abs(currentHeading) === 135) {
      const newHeading = -currentHeading;
      return { ok: true, newHeading, label: `Jibed to ${headingName(newHeading)}` };
    }
    return { ok: false, error: "Can't cross tacks from a Beam Reach — head up to Close Reach or fall off to Broad Reach first." };
  }

  const fallingOff = tillerSide === windwardNow;
  if (fallingOff) {
    if (Math.abs(currentHeading) === 135) {
      return { ok: false, error: "Already at Broad Reach — move the crew to the other side to jibe and keep bearing away." };
    }
    const newHeading = currentHeading + Math.sign(currentHeading) * 45;
    return { ok: true, newHeading, label: `Fell off to ${headingName(newHeading)}` };
  }
  if (Math.abs(currentHeading) === 45) {
    return { ok: false, error: "Already at Close Reach — move the crew to the other side to tack and head further upwind." };
  }
  const newHeading = currentHeading - Math.sign(currentHeading) * 45;
  return { ok: true, newHeading, label: `Headed up to ${headingName(newHeading)}` };
}

/** Every heading reachable from `heading` in exactly one legal move (ignoring tiller/crew — just the graph). */
export function legalNextHeadings(heading: number): number[] {
  const out: number[] = [];
  if (Math.abs(heading) > 45) out.push(heading - Math.sign(heading) * 45); // head up
  if (Math.abs(heading) < 135) out.push(heading + Math.sign(heading) * 45); // fall off
  if (Math.abs(heading) === 45 || Math.abs(heading) === 135) out.push(-heading); // tack / jibe
  return out;
}
