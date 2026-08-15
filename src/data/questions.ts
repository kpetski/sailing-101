import { TERMS } from "./terms";
import { HULL_LABEL_POINTS, RIG_LABEL_POINTS } from "../components/LabelDiagram";
import type {
  LabelQuestion,
  ManeuverQuestion,
  PointOfSailQuestion,
  Question,
  RecallQuestion,
  Term,
  TopicId,
} from "./types";

/** Small deterministic shuffle so choice order varies per-question but stays stable across runs. */
function seededShuffle<T>(arr: T[], seedStr: string): T[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Picks up to 3 "nearby" definitions from the same topic (cyclic) to use as multiple-choice distractors. */
function distractorDefinitions(term: Term, all: Term[]): string[] {
  const sameTopic = all.filter((t) => t.topic === term.topic);
  if (sameTopic.length < 4) return [];
  const idx = sameTopic.findIndex((t) => t.id === term.id);
  const distractors: string[] = [];
  for (let offset = 1; distractors.length < 3; offset++) {
    distractors.push(sameTopic[(idx + offset) % sameTopic.length].definition);
  }
  return distractors;
}

/**
 * Recall questions are generated automatically from src/data/terms.ts — add
 * or edit a term there and its quiz questions update on their own. No need
 * to touch this file for plain term/definition content.
 */
function buildRecallQuestions(): RecallQuestion[] {
  const questions: RecallQuestion[] = [];

  for (const term of TERMS) {
    questions.push({
      id: `${term.id}--def-to-term`,
      topic: term.topic,
      type: "recall",
      prompt: `What term/concept does this describe?\n"${term.definition}"`,
      answer: term.term,
      acceptableAnswers: [term.term],
    });

    const distractors = distractorDefinitions(term, TERMS);
    if (distractors.length === 3) {
      questions.push({
        id: `${term.id}--term-to-def`,
        topic: term.topic,
        type: "recall",
        prompt: `Which definition matches "${term.term}"?`,
        answer: term.definition,
        choices: seededShuffle([term.definition, ...distractors], term.id),
      });
    }
  }

  return questions;
}

/**
 * Maneuver-identification scenarios, ported from the original
 * sailing-maneuvers.html reference cards. Add more by following the same
 * shape — heading numbers are "wheel degrees" (0 = dead upwind, ±180 = dead
 * downwind, positive = starboard side).
 */
const MANEUVER_QUESTIONS: ManeuverQuestion[] = [
  {
    id: "maneuver-obstacle-close-reach",
    topic: "tackingJibing",
    type: "maneuver",
    prompt:
      "You're on a close reach on starboard tack (wind on your right, boom out left) — about as close to the wind as your boat sails. Rocks are ahead. You turn away from the wind, staying on the same side the wind is hitting the whole time, ending up on a beam reach.",
    answer: "fallOff",
    boats: [
      { heading: -45, color: "#7fb3ab", label: "start (close reach)" },
      { heading: -78, color: "#c8973a", label: "end (beam reach)", dashed: true },
    ],
    turnArc: { from: -45, to: -78, color: "#c8973a" },
    obstacleAt: -50,
    targetAt: -78,
    why: "The wind stays on the same side the whole turn — you never cross through it, and you never leave starboard tack. That means this is not a tack or jibe at all. You've simply fallen off (turned away from the wind), moving from close reach toward beam reach. Sails ease out, no jib-sheet swap, no boom crossing.",
  },
  {
    id: "maneuver-upwind-left-target",
    topic: "tackingJibing",
    type: "maneuver",
    prompt:
      "You're on a close reach on starboard tack. Your destination is upwind, but on the opposite side — past the No-Go Zone. There's no way to fall off and get there; you must cross through the wind.",
    answer: "tack",
    boats: [
      { heading: -20, color: "#7fb3ab", label: "start (stbd tack)" },
      { heading: 20, color: "#1f6f6b", label: "end (port tack)", dashed: true },
    ],
    turnArc: { from: -20, to: 20, color: "#1f6f6b" },
    targetAt: 20,
    why: "Because the target sits on the far side of the No-Go Zone, the only way there is to turn the bow through the wind — that's the definition of a tack. You'll end up on a close reach on port tack, wind now hitting your left side, boom swung to the right.",
  },
  {
    id: "maneuver-run-mark-behind",
    topic: "tackingJibing",
    type: "maneuver",
    prompt:
      "You're on a run, wind directly behind you, boom out to the left. The mark you need is behind-right — on the other side of straight-downwind.",
    answer: "jibe",
    boats: [
      { heading: 160, color: "#3f5c56", label: "start" },
      { heading: 200, color: "#b5533c", label: "end", dashed: true },
    ],
    turnArc: { from: 160, to: 200, color: "#b5533c" },
    targetAt: 200,
    why: "You're already sailing away from the wind, so there's no No-Go Zone to deal with. To change sides while staying downwind, the stern crosses through the wind instead of the bow — that's a jibe. Watch the boom: it swings hard from left to right as the stern passes through dead-downwind.",
  },
  {
    id: "maneuver-beam-reach-shoal",
    topic: "tackingJibing",
    type: "maneuver",
    prompt:
      "You're on a beam reach (wind at 90°, boom out to the side). A shallow shoal sits ahead. You want to angle closer to the wind to sail around it without crossing it.",
    answer: "headUp",
    boats: [
      { heading: 90, color: "#7fb3ab", label: "start (beam)" },
      { heading: 35, color: "#0f3d3e", label: "end (close reach)", dashed: true },
    ],
    turnArc: { from: 90, to: 35, color: "#0f3d3e" },
    obstacleAt: 70,
    targetAt: 35,
    why: "Turning toward the wind (without crossing through it) is called heading up. You move up the wheel toward close reach — as close to the wind as your boat will point. Sails need to be trimmed in tighter as you head up — same side, no maneuver name change, just a course and trim adjustment.",
  },
  {
    id: "maneuver-broad-reach-gusty",
    topic: "tackingJibing",
    type: "maneuver",
    prompt:
      "You're on a broad reach and it's gusty — the boat's heeling more than you'd like. You ease the sails and turn slightly away from the wind toward a run.",
    answer: "fallOff",
    boats: [
      { heading: 150, color: "#3f5c56", label: "start (broad)" },
      { heading: 172, color: "#c8973a", label: "end (run)", dashed: true },
    ],
    turnArc: { from: 150, to: 172, color: "#c8973a" },
    targetAt: 172,
    why: "Turning away from the wind (without fully crossing it to a jibe) is falling off. Moving from broad reach toward a run generally reduces heel and eases pressure on the sails — a common move to depower in a gust, and just a course change, not a jibe, since you stayed on the same side.",
  },
  {
    id: "maneuver-upwind-right-target",
    topic: "tackingJibing",
    type: "maneuver",
    prompt:
      "You're close reaching on starboard tack (wind on right, boom out left). Your destination is upwind and to the right — past where you can point without hitting the No-Go Zone.",
    answer: "tack",
    boats: [
      { heading: -40, color: "#7fb3ab", label: "start (stbd tack)" },
      { heading: 40, color: "#1f6f6b", label: "end (port tack)", dashed: true },
    ],
    turnArc: { from: -40, to: 40, color: "#1f6f6b" },
    targetAt: 40,
    why: "Any time the target is on the opposite side of the No-Go Zone from where you're currently pointed, and you're on the upwind half of the wheel, you'll need to tack — turning the bow through the wind — to eventually get there, often across multiple tacks in a zigzag.",
  },
];

/** "What point of sail is this?" — single-boat diagram ID questions. */
const POINT_OF_SAIL_QUESTIONS: PointOfSailQuestion[] = [
  {
    id: "pos-irons",
    topic: "pointsOfSail",
    type: "pointOfSail",
    prompt: "What point of sail is this boat on?",
    answer: "No-Go Zone",
    boats: { heading: 0, color: "#0f3d3e" },
    why: "Pointed dead into the wind, inside the shaded wedge — sails would just luff here. This is the No-Go (No-Sail) Zone.",
  },
  {
    id: "pos-close-reach-stbd",
    topic: "pointsOfSail",
    type: "pointOfSail",
    prompt: "What point of sail is this boat on?",
    answer: "Close Reach",
    boats: { heading: -45, color: "#7fb3ab" },
    why: "Just outside the No-Go Zone, sails trimmed in fairly tight — this is a close reach, the closest most keelboats sail to the wind.",
  },
  {
    id: "pos-beam-reach-port",
    topic: "pointsOfSail",
    type: "pointOfSail",
    prompt: "What point of sail is this boat on?",
    answer: "Beam Reach",
    boats: { heading: 90, color: "#7fb3ab" },
    why: "Wind hitting roughly at a right angle to the boat, boom out around 45° — a beam reach.",
  },
  {
    id: "pos-broad-reach-stbd",
    topic: "pointsOfSail",
    type: "pointOfSail",
    prompt: "What point of sail is this boat on?",
    answer: "Broad Reach",
    boats: { heading: -135, color: "#3f5c56" },
    why: "Wind coming from behind and to one side, boom eased well out — between beam reach and a run, this is a broad reach.",
  },
  {
    id: "pos-run",
    topic: "pointsOfSail",
    type: "pointOfSail",
    prompt: "What point of sail is this boat on?",
    answer: "Run",
    boats: { heading: 180, color: "#3f5c56" },
    why: "Wind directly behind, boom eased all the way out to (roughly) perpendicular — this is a run.",
  },
];

/**
 * "What is the highlighted part called?" questions, generated automatically
 * from the label points in src/components/LabelDiagram.tsx (which themselves
 * reference term ids in terms.ts). Add a new labeled part by adding a point
 * there — a question shows up here for free.
 */
function buildLabelQuestions(): LabelQuestion[] {
  const sources: { variant: "hull" | "rig"; points: typeof HULL_LABEL_POINTS; topic: TopicId }[] = [
    { variant: "hull", points: HULL_LABEL_POINTS, topic: "nomenclature" },
    { variant: "rig", points: RIG_LABEL_POINTS, topic: "rig" },
  ];
  const questions: LabelQuestion[] = [];
  for (const { variant, points, topic } of sources) {
    for (const point of points) {
      const term = TERMS.find((t) => t.id === point.id);
      if (!term) continue;
      questions.push({
        id: `label-${point.id}`,
        topic,
        type: "label",
        prompt: "What is the highlighted part called?",
        answer: term.term,
        acceptableAnswers: [term.term],
        variant,
        points,
        activeId: point.id,
      });
    }
  }
  return questions;
}

export const QUESTIONS: Question[] = [
  ...buildRecallQuestions(),
  ...MANEUVER_QUESTIONS,
  ...POINT_OF_SAIL_QUESTIONS,
  ...buildLabelQuestions(),
];
