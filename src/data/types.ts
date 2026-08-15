import type { BoatSpec, Maneuver, TurnArcSpec } from "../components/PointsOfSailDiagram";
import type { LabelPoint } from "../components/LabelDiagram";

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
  "No-Go Zone",
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

export type Question = RecallQuestion | ManeuverQuestion | PointOfSailQuestion | LabelQuestion;
