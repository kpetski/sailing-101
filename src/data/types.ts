import type { BoatSpec, Maneuver, TurnArcSpec } from "../components/PointsOfSailDiagram";
import type { LabelPoint } from "../components/LabelDiagram";
import type { LakeBoat, LakeDock, LakeMark, LakeRoute } from "../components/LakeMap";

export type TopicId =
  | "nomenclature"
  | "rig"
  | "pointsOfSail"
  | "tackingJibing"
  | "sailTrim"
  | "rightOfWay"
  | "dockingCOB"
  | "threeKeyQuestions";

export interface Topic {
  id: TopicId;
  title: string;
  blurb: string;
  /** Excluded from topic lists and quiz pools — content still exists but isn't ready to show. */
  hidden?: boolean;
}

/** A single term/definition pair used on reference pages and in recall questions. */
export interface Term {
  id: string;
  topic: TopicId;
  term: string;
  definition: string;
}

export interface RecallQuestion {
  id: string;
  topic: TopicId;
  type: "recall";
  /** The question text shown to the user. */
  prompt: string;
  /** The canonical correct answer, shown in feedback. */
  answer: string;
  /** All strings (besides `answer`) accepted as correct for free-text grading, matched case/whitespace-insensitively. */
  acceptableAnswers?: string[];
  /** If present, rendered as multiple choice (should include the correct answer). Otherwise rendered as free text. */
  choices?: string[];
}

export interface ManeuverQuestion {
  id: string;
  topic: TopicId;
  type: "maneuver";
  prompt: string;
  answer: Maneuver;
  boats: BoatSpec | BoatSpec[];
  turnArc?: TurnArcSpec;
  obstacleAt?: number;
  targetAt?: number;
  why: string;
}

/** "What point of sail is this?" — always rendered with the fixed POINT_OF_SAIL_CHOICES. */
export interface PointOfSailQuestion {
  id: string;
  topic: TopicId;
  type: "pointOfSail";
  prompt: string;
  answer: string;
  boats: BoatSpec | BoatSpec[];
  why?: string;
}

export const POINT_OF_SAIL_CHOICES = [
  "Irons (No-Go Zone)",
  "Close Reach",
  "Beam Reach",
  "Broad Reach",
  "Run",
] as const;

/** "What is the highlighted part called?" — a labeled-diagram identification question. */
export interface LabelQuestion {
  id: string;
  topic: TopicId;
  type: "label";
  prompt: string;
  answer: string;
  acceptableAnswers?: string[];
  variant: "hull" | "rig";
  points: LabelPoint[];
  activeId: string;
}

/**
 * "What point of sail matches this wind-indicator angle?" — the skipper's-eye
 * view (fixed boat, rotating indicator) rather than the aerial wheel. Always
 * rendered with the fixed POINT_OF_SAIL_CHOICES, same as PointOfSailQuestion.
 */
export interface SkipperViewQuestion {
  id: string;
  topic: TopicId;
  type: "skipperView";
  prompt: string;
  answer: string;
  heading: number;
  why?: string;
}

/**
 * "What tack are you on?" — same skipper's-eye wind indicator as
 * SkipperViewQuestion, but asking port vs. starboard instead of the point
 * of sail. Only generated for headings with a defined tack (a reach, not
 * dead upwind/downwind). Always rendered with the fixed TACK_CHOICES.
 */
export interface TackQuestion {
  id: string;
  topic: TopicId;
  type: "tack";
  prompt: string;
  answer: string;
  heading: number;
  why: string;
}

export const TACK_CHOICES = ["Port Tack", "Starboard Tack"] as const;

/**
 * "As you go from X to Y, do you sheet in or ease?" — a start/end boat pair
 * like ManeuverQuestion, but asking about trim direction rather than naming
 * the maneuver. Always rendered with the fixed TRIM_CHOICES.
 */
export interface TrimActionQuestion {
  id: string;
  topic: TopicId;
  type: "trimAction";
  prompt: string;
  answer: string;
  boats: BoatSpec | BoatSpec[];
  turnArc?: TurnArcSpec;
  why: string;
}

export const TRIM_CHOICES = ["Sheet In", "Ease (Sheet Out)"] as const;

/**
 * "Your wind indicator looks like this, and you want to head up/bear away
 * to a new point of sail — which way do you move the tiller?" Rendered
 * with the skipper's-eye view (a single current heading, no destination
 * shown) and the fixed TILLER_CHOICES.
 */
export interface TillerDirectionQuestion {
  id: string;
  topic: TopicId;
  type: "tillerDirection";
  prompt: string;
  answer: string;
  heading: number;
  why: string;
}

export const TILLER_CHOICES = ["Push Tiller Away", "Pull Tiller Toward You"] as const;

/**
 * "You push/pull the tiller from this point of sail and hold the new
 * course — what point of sail do you end up on?" Same start/end wheel
 * diagram as ManeuverQuestion and TrimActionQuestion, but the end boat's
 * label is deliberately generic ("end", no point-of-sail name) since
 * naming the destination is the answer being tested. Always rendered with
 * the fixed POINT_OF_SAIL_CHOICES.
 */
export interface NewPointOfSailQuestion {
  id: string;
  topic: TopicId;
  type: "newPointOfSail";
  prompt: string;
  answer: string;
  boats: BoatSpec | BoatSpec[];
  turnArc?: TurnArcSpec;
  why: string;
}

/**
 * "How do you get from here to there?" — a single boat plus a destination
 * dock/mark on the lake map, asking for the maneuver in general terms
 * rather than a specific point-of-sail name. Always rendered with the
 * fixed NAV_MANEUVER_CHOICES.
 */
export interface NavManeuverQuestion {
  id: string;
  topic: TopicId;
  type: "navManeuver";
  prompt: string;
  answer: string;
  boats: LakeBoat[];
  docks?: LakeDock[];
  marks?: LakeMark[];
  why: string;
}

export const NAV_MANEUVER_CHOICES = [
  "Tack upwind in a zigzag",
  "Sail a single straight course",
  "Bear away, then jibe downwind",
] as const;

/**
 * "Which of these routes actually gets you there?" — same lake map, but
 * with 2-3 candidate paths drawn on the water; the wrong ones cut through
 * the No-Go Zone or across land. Answer is the route's own label (e.g.
 * "Route B"), not a fixed choice set — choices come from `routes`.
 */
export interface NavRouteQuestion {
  id: string;
  topic: TopicId;
  type: "navRoute";
  prompt: string;
  answer: string;
  boats: LakeBoat[];
  docks?: LakeDock[];
  marks?: LakeMark[];
  routes: LakeRoute[];
  why: string;
}

/**
 * "Which boat has right of way?" — two (or more) boats placed on open
 * water on the lake map, testing the COLREGS rules from the Right of Way
 * topic (starboard/port, leeward/windward, overtaking, sail-over-power).
 * Answer is a boat's own label, not a fixed choice set.
 */
export interface RightOfWayQuestion {
  id: string;
  topic: TopicId;
  type: "rightOfWay";
  prompt: string;
  answer: string;
  boats: LakeBoat[];
  why: string;
}

export type Question =
  | RecallQuestion
  | ManeuverQuestion
  | PointOfSailQuestion
  | LabelQuestion
  | SkipperViewQuestion
  | TrimActionQuestion
  | TillerDirectionQuestion
  | NewPointOfSailQuestion
  | NavManeuverQuestion
  | NavRouteQuestion
  | RightOfWayQuestion
  | TackQuestion;
