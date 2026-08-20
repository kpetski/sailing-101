import { TERMS } from "./terms";
import { TOPIC_MAP } from "./topics";
import { HULL_LABEL_POINTS, RIG_LABEL_POINTS } from "../components/LabelDiagram";
import { SKIPPER_VIEW_POINTS } from "../components/SkipperView";
import type {
  LabelQuestion,
  ManeuverQuestion,
  NavManeuverQuestion,
  NavRouteQuestion,
  NewPointOfSailQuestion,
  PointOfSailQuestion,
  Question,
  RecallQuestion,
  RightOfWayQuestion,
  SkipperViewQuestion,
  TackQuestion,
  Term,
  TillerDirectionQuestion,
  TopicId,
  TrimActionQuestion,
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
      acceptableAnswers: [term.term, ...(term.acceptableAnswers ?? [])],
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
      "You're on a close reach on starboard tack. Your destination is upwind, but on the opposite side — past irons. There's no way to fall off and get there; you must cross through the wind.",
    answer: "tack",
    boats: [
      { heading: -20, color: "#7fb3ab", label: "start (stbd tack)" },
      { heading: 20, color: "#1f6f6b", label: "end (port tack)", dashed: true },
    ],
    turnArc: { from: -20, to: 20, color: "#1f6f6b" },
    targetAt: 20,
    why: "Because the target sits on the far side of irons, the only way there is to turn the bow through the wind — that's the definition of a tack. You'll end up on a close reach on port tack, wind now hitting your left side, boom swung to the right.",
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
    why: "You're already sailing away from the wind, so there's no irons to deal with. To change sides while staying downwind, the stern crosses through the wind instead of the bow — that's a jibe. Watch the boom: it swings hard from left to right as the stern passes through dead-downwind.",
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
      "You're close reaching on starboard tack (wind on right, boom out left). Your destination is upwind and to the right — past where you can point without heading into irons.",
    answer: "tack",
    boats: [
      { heading: -40, color: "#7fb3ab", label: "start (stbd tack)" },
      { heading: 40, color: "#1f6f6b", label: "end (port tack)", dashed: true },
    ],
    turnArc: { from: -40, to: 40, color: "#1f6f6b" },
    targetAt: 40,
    why: "Any time the target is on the opposite side of irons from where you're currently pointed, and you're on the upwind half of the wheel, you'll need to tack — turning the bow through the wind — to eventually get there, often across multiple tacks in a zigzag.",
  },
];

/**
 * "Do you sheet in or ease?" — same start/end boat-pair shape as the
 * maneuver scenarios, but testing trim direction: moving away from the
 * irons (toward a run) always means easing; moving toward it always
 * means sheeting in, regardless of which side of the wheel you're on.
 */
const TRIM_QUESTIONS: TrimActionQuestion[] = [
  {
    id: "trim-close-to-beam",
    topic: "sailTrim",
    type: "trimAction",
    prompt: "You're on a close reach and bear away to a beam reach. Do you sheet in or ease?",
    answer: "Ease (Sheet Out)",
    boats: [
      { heading: -45, color: "#7fb3ab", label: "start (close reach)" },
      { heading: -90, color: "#3f5c56", label: "end (beam reach)", dashed: true },
    ],
    turnArc: { from: -45, to: -90, color: "#3f5c56" },
    why: "Bearing away moves you farther from irons, so the wind angle opens up — the sails need to swing farther out to stay filled. Ease the sheets.",
  },
  {
    id: "trim-beam-to-close",
    topic: "sailTrim",
    type: "trimAction",
    prompt: "You're on a beam reach and head up to a close reach. Do you sheet in or ease?",
    answer: "Sheet In",
    boats: [
      { heading: 90, color: "#7fb3ab", label: "start (beam reach)" },
      { heading: 45, color: "#0f3d3e", label: "end (close reach)", dashed: true },
    ],
    turnArc: { from: 90, to: 45, color: "#0f3d3e" },
    why: "Heading up moves you closer to irons, narrowing the wind angle — the sails need to pull in tighter to stay filled without luffing. Sheet in.",
  },
  {
    id: "trim-beam-to-broad",
    topic: "sailTrim",
    type: "trimAction",
    prompt: "You're on a beam reach and bear away to a broad reach. Do you sheet in or ease?",
    answer: "Ease (Sheet Out)",
    boats: [
      { heading: -90, color: "#7fb3ab", label: "start (beam reach)" },
      { heading: -135, color: "#3f5c56", label: "end (broad reach)", dashed: true },
    ],
    turnArc: { from: -90, to: -135, color: "#3f5c56" },
    why: "Still bearing away — still opening the wind angle. Keep easing the sheets as you turn farther from irons.",
  },
  {
    id: "trim-broad-to-run",
    topic: "sailTrim",
    type: "trimAction",
    prompt: "You're on a broad reach and bear away to a run. Do you sheet in or ease?",
    answer: "Ease (Sheet Out)",
    boats: [
      { heading: 135, color: "#3f5c56", label: "start (broad reach)" },
      { heading: 180, color: "#c8973a", label: "end (run)", dashed: true },
    ],
    turnArc: { from: 135, to: 180, color: "#c8973a" },
    why: "A run is as far from irons as you can get — sails eased all the way out, roughly perpendicular to the boat.",
  },
  {
    id: "trim-run-to-close",
    topic: "sailTrim",
    type: "trimAction",
    prompt:
      "You're on a run and head up all the way to a close reach — a big course change. Do you sheet in or ease?",
    answer: "Sheet In",
    boats: [
      { heading: 180, color: "#c8973a", label: "start (run)" },
      { heading: -45, color: "#7fb3ab", label: "end (close reach)", dashed: true },
    ],
    turnArc: { from: 180, to: -45, color: "#7fb3ab" },
    why: "Heading all the way up from a run to a close reach means continuously trimming in as you go — the sails end up pulled in tight, close to the centerline.",
  },
  {
    id: "trim-broad-to-beam",
    topic: "sailTrim",
    type: "trimAction",
    prompt: "You're on a broad reach and head up to a beam reach. Do you sheet in or ease?",
    answer: "Sheet In",
    boats: [
      { heading: -135, color: "#3f5c56", label: "start (broad reach)" },
      { heading: -90, color: "#7fb3ab", label: "end (beam reach)", dashed: true },
    ],
    turnArc: { from: -135, to: -90, color: "#7fb3ab" },
    why: "Heading up — even partway — always means trimming in, since you're narrowing the wind angle back toward irons.",
  },
];

/**
 * Shared start/end heading pairs behind the two builders below — same six
 * transitions as TRIM_QUESTIONS above, but generating a tiller-direction
 * question (skipper's-eye view, current heading only) and a
 * new-point-of-sail question (wheel diagram, destination unlabeled) from
 * each one instead of a trim-direction question.
 */
const TURN_SCENARIOS: {
  id: string;
  startHeading: number;
  startLabel: string;
  endHeading: number;
  endLabel: string;
  endName: string;
  color: string;
}[] = [
  { id: "close-to-beam", startHeading: -45, startLabel: "close reach", endHeading: -90, endLabel: "beam reach", endName: "Beam Reach", color: "#3f5c56" },
  { id: "beam-to-close", startHeading: 90, startLabel: "beam reach", endHeading: 45, endLabel: "close reach", endName: "Close Reach", color: "#0f3d3e" },
  { id: "beam-to-broad", startHeading: -90, startLabel: "beam reach", endHeading: -135, endLabel: "broad reach", endName: "Broad Reach", color: "#3f5c56" },
  { id: "broad-to-run", startHeading: 135, startLabel: "broad reach", endHeading: 180, endLabel: "run", endName: "Run", color: "#c8973a" },
  { id: "run-to-close", startHeading: 180, startLabel: "run", endHeading: -45, endLabel: "close reach", endName: "Close Reach", color: "#7fb3ab" },
  { id: "broad-to-beam", startHeading: -135, startLabel: "broad reach", endHeading: -90, endLabel: "beam reach", endName: "Beam Reach", color: "#7fb3ab" },
];

/**
 * "Which way do you move the tiller?" — the current point of sail is shown
 * via the skipper's-eye wind indicator (same read as the SkipperView
 * reference), and the desired direction is described in words rather than
 * a second boat, since a single indicator can't show two angles at once.
 */
function buildTillerDirectionQuestions(): TillerDirectionQuestion[] {
  const topics: TopicId[] = ["sailTrim", "tackingJibing"];
  const questions: TillerDirectionQuestion[] = [];
  for (const topic of topics) {
    for (const s of TURN_SCENARIOS) {
      const headingUp = Math.abs(s.endHeading) < Math.abs(s.startHeading);
      questions.push({
        id: `tiller-${s.id}--${topic}`,
        topic,
        type: "tillerDirection",
        prompt: `Your wind indicator looks like this — you're on a ${s.startLabel}. You want to ${headingUp ? "head up" : "bear away"} to a ${s.endLabel}. Which way do you move the tiller?`,
        answer: headingUp ? "Push Tiller Away" : "Pull Tiller Toward You",
        heading: s.startHeading,
        why: headingUp
          ? "Pushing the tiller away from you (toward the sail) turns the bow toward the wind — heading up."
          : "Pulling the tiller toward you turns the bow away from the wind — falling off.",
      });
    }
  }
  return questions;
}

/**
 * "What point of sail do you end up on?" — same wheel diagram as a
 * maneuver/trim question, but the end boat's label stays generic ("end")
 * instead of naming the destination, since that name is the answer.
 */
function buildNewPointOfSailQuestions(): NewPointOfSailQuestion[] {
  const topics: TopicId[] = ["pointsOfSail", "sailTrim"];
  const questions: NewPointOfSailQuestion[] = [];
  for (const topic of topics) {
    for (const s of TURN_SCENARIOS) {
      const headingUp = Math.abs(s.endHeading) < Math.abs(s.startHeading);
      questions.push({
        id: `newpos-${s.id}--${topic}`,
        topic,
        type: "newPointOfSail",
        prompt: `You're on a ${s.startLabel} and ${headingUp ? "push the tiller away from you (heading up)" : "pull the tiller toward you (falling off)"}, holding the new course. What point of sail do you end up on?`,
        answer: s.endName,
        boats: [
          { heading: s.startHeading, color: "#7fb3ab", label: `start (${s.startLabel})` },
          { heading: s.endHeading, color: "#3f5c56", label: "end", dashed: true },
        ],
        turnArc: { from: s.startHeading, to: s.endHeading, color: s.color },
        why: `Turning ${headingUp ? "toward" : "away from"} irons from a ${s.startLabel} lands you on a ${s.endLabel}.`,
      });
    }
  }
  return questions;
}

/** "What point of sail is this?" — single-boat diagram ID questions. */
const POINT_OF_SAIL_QUESTIONS: PointOfSailQuestion[] = [
  {
    id: "pos-irons",
    topic: "pointsOfSail",
    type: "pointOfSail",
    prompt: "What point of sail is this boat on?",
    answer: "Irons (No-Go Zone)",
    boats: { heading: 0, color: "#0f3d3e" },
    why: "Pointed dead into the wind, inside the shaded wedge — sails would just luff here. This is irons, also called the No-Go (No-Sail) Zone.",
  },
  {
    id: "pos-close-reach-stbd",
    topic: "pointsOfSail",
    type: "pointOfSail",
    prompt: "What point of sail is this boat on?",
    answer: "Close Reach",
    boats: { heading: -45, color: "#7fb3ab" },
    why: "Just outside irons, sails trimmed in fairly tight — this is a close reach, the closest most keelboats sail to the wind.",
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

/**
 * "What point of sail matches this wind indicator?" — the skipper's-eye
 * view, generated from src/components/SkipperView.tsx's shared list. Shown
 * up in both Points of Sail and Sail Trim quizzes, since the underlying
 * reference (in the Sail Trim topic reference page) ties the two together.
 */
function buildSkipperViewQuestions(): SkipperViewQuestion[] {
  const topics: TopicId[] = ["pointsOfSail", "sailTrim"];
  const questions: SkipperViewQuestion[] = [];
  for (const topic of topics) {
    for (const point of SKIPPER_VIEW_POINTS) {
      questions.push({
        id: `skipper-${point.id}--${topic}`,
        topic,
        type: "skipperView",
        prompt: "Your wind indicator looks like this. What point of sail are you on?",
        answer: point.name,
        heading: point.heading,
        why: point.caption,
      });
    }
  }
  return questions;
}

/**
 * "What tack are you on?" — same skipper's-eye wind indicator, but only
 * for the six reach headings that have a defined tack (skips irons and a
 * run, where you're momentarily on neither). Port/starboard is baked into
 * each SKIPPER_VIEW_POINTS id already, so no angle math needed here.
 */
function buildTackQuestions(): TackQuestion[] {
  const topics: TopicId[] = ["sailTrim", "tackingJibing", "pointsOfSail"];
  const questions: TackQuestion[] = [];
  for (const topic of topics) {
    for (const point of SKIPPER_VIEW_POINTS) {
      const isPort = point.id.endsWith("-port");
      const isStbd = point.id.endsWith("-stbd");
      if (!isPort && !isStbd) continue;
      const tack = isPort ? "Port Tack" : "Starboard Tack";
      questions.push({
        id: `tack-${point.id}--${topic}`,
        topic,
        type: "tack",
        prompt: "Your wind indicator looks like this. What tack are you on?",
        answer: tack,
        heading: point.heading,
        why: `The wind indicator swings to leeward, opposite the side the wind is hitting. Here it's leaning to the ${
          isPort ? "right, so the wind is hitting the left (port) side" : "left, so the wind is hitting the right (starboard) side"
        } — ${tack}.`,
      });
    }
  }
  return questions;
}

/**
 * Right-of-way scenarios on the lake map — one per rule on the Right of
 * Way reference page (starboard/port, leeward/windward, overtaking,
 * sail-over-power). `answer` is the give-way-exempt boat's own label.
 */
const RIGHT_OF_WAY_QUESTIONS: RightOfWayQuestion[] = [
  {
    id: "row-starboard-port",
    topic: "rightOfWay",
    type: "rightOfWay",
    prompt:
      "Boat A is on starboard tack (wind over her right side); Boat B is on port tack. Their courses are converging. Who has right of way?",
    answer: "Boat A",
    boats: [
      { x: 170, y: 210, heading: -40, color: "#7fb3ab", label: "Boat A" },
      { x: 300, y: 190, heading: 40, color: "#b5533c", label: "Boat B" },
    ],
    why: "Starboard tack over port tack: when two sailboats on opposite tacks are converging, the boat on starboard tack (wind hitting her right side) holds right of way, and the port-tack boat must keep clear.",
  },
  {
    id: "row-leeward-windward",
    topic: "rightOfWay",
    type: "rightOfWay",
    prompt:
      "Boat A and Boat B are on the same tack, sailing side by side on a beam reach. Boat A is to leeward, Boat B is to windward. Who has right of way?",
    answer: "Boat A",
    boats: [
      { x: 200, y: 235, heading: 90, color: "#7fb3ab", label: "Boat A" },
      { x: 200, y: 145, heading: 90, color: "#b5533c", label: "Boat B" },
    ],
    why: "Leeward over windward: between two sailboats on the same tack, the leeward (downwind) boat has right of way over the windward boat, which must keep clear.",
  },
  {
    id: "row-overtaking",
    topic: "rightOfWay",
    type: "rightOfWay",
    prompt: "Boat A is coming up from astern on Boat B, same course, about to pass. Who has right of way?",
    answer: "Boat B",
    boats: [
      { x: 250, y: 145, heading: 175, color: "#b5533c", label: "Boat A" },
      { x: 250, y: 235, heading: 175, color: "#7fb3ab", label: "Boat B" },
    ],
    why: "Overtaking vessel gives way: any boat coming from behind and passing another must keep clear, regardless of tack or sail/power — Boat B, being overtaken, holds right of way.",
  },
  {
    id: "row-sail-power",
    topic: "rightOfWay",
    type: "rightOfWay",
    prompt: "Boat A (under sail) and a powerboat are on converging courses in open water. Who has right of way?",
    answer: "Boat A",
    boats: [
      { x: 180, y: 210, heading: 55, color: "#7fb3ab", label: "Boat A" },
      { x: 300, y: 200, heading: -55, color: "#8a8168", label: "Powerboat" },
    ],
    why: "Sailboats over powerboats: under sail, a sailboat generally holds right of way over a powerboat — except commercial vessels, vessels towing, and vessels restricted in their ability to maneuver.",
  },
];

/**
 * "How do you get there?" scenarios — a boat, a destination, and a
 * described wind relationship (stated in the prompt, not left for the
 * student to infer from lake geometry alone, since the shoreline is just
 * illustrative). Answer is one of the fixed NAV_MANEUVER_CHOICES.
 */
const NAV_MANEUVER_QUESTIONS: NavManeuverQuestion[] = [
  {
    id: "nav-upwind-mark",
    topic: "tackingJibing",
    type: "navManeuver",
    prompt: "You leave the dock and need to reach the mark, which sits directly upwind of you. How do you get there?",
    answer: "Tack upwind in a zigzag",
    boats: [{ x: 150, y: 265, heading: 0, color: "#0f3d3e", label: "You" }],
    docks: [{ x: 150, y: 285, angle: 180, label: "Dock" }],
    marks: [{ x: 150, y: 90, label: "Mark" }],
    why: "Straight upwind is the No-Go Zone — sails can't generate power pointed there. The only way to make progress toward a mark dead upwind is a series of close-hauled legs, tacking back and forth.",
  },
  {
    id: "nav-downwind-mark",
    topic: "tackingJibing",
    type: "navManeuver",
    prompt: "You need to reach a mark directly downwind of you, with clear open water the whole way. How do you get there?",
    answer: "Sail a single straight course",
    boats: [{ x: 260, y: 130, heading: 180, color: "#0f3d3e", label: "You" }],
    marks: [{ x: 260, y: 290, label: "Mark" }],
    why: "A mark dead downwind, with nothing in the way, just needs a run — point the bow at it, ease the sails out, and hold that single straight course.",
  },
  {
    id: "nav-behind-downwind",
    topic: "tackingJibing",
    type: "navManeuver",
    prompt:
      "You're sailing downwind and the mark you need is behind you, on the other side of dead-downwind. How do you get there?",
    answer: "Bear away, then jibe downwind",
    boats: [{ x: 350, y: 130, heading: 170, color: "#0f3d3e", label: "You" }],
    marks: [{ x: 250, y: 255, label: "Mark" }],
    why: "You're already on the downwind half of the wheel, so there's no No-Go Zone to deal with. To change which side the wind hits while staying downwind, jibe — the stern crosses through the wind instead of the bow.",
  },
];

/**
 * "Which route actually works?" — same upwind-mark problem as
 * nav-upwind-mark above, but now the student picks between drawn routes
 * instead of naming the maneuver: one cuts straight through the No-Go
 * Zone, one runs aground, and one tacks its way there correctly.
 */
const NAV_ROUTE_QUESTIONS: NavRouteQuestion[] = [
  {
    id: "navroute-upwind-a",
    topic: "pointsOfSail",
    type: "navRoute",
    prompt: "Which route actually gets this boat to the upwind mark?",
    answer: "Route B",
    boats: [{ x: 150, y: 265, heading: 0, color: "#0f3d3e", label: "You" }],
    docks: [{ x: 150, y: 285, angle: 180, label: "Dock" }],
    marks: [{ x: 150, y: 90, label: "Mark" }],
    routes: [
      { points: [[150, 265], [150, 90]], color: "#b5533c", label: "Route A" },
      {
        points: [
          [150, 265],
          [235, 210],
          [155, 160],
          [235, 115],
          [150, 90],
        ],
        color: "#1f6f6b",
        label: "Route B",
      },
      { points: [[150, 265], [470, 250], [460, 60], [150, 90]], color: "#8a4a3c", label: "Route C" },
    ],
    why: "Route A tries to sail straight into the No-Go Zone — the sails would just luff and the boat stalls. Route C swings wide across the shore. Route B tacks back and forth, making progress upwind through a series of close reaches — that's the only one that actually works.",
  },
  {
    id: "navroute-upwind-b",
    topic: "pointsOfSail",
    type: "navRoute",
    prompt: "Which route actually gets this boat to the upwind mark?",
    answer: "Route B",
    boats: [{ x: 400, y: 260, heading: 15, color: "#0f3d3e", label: "You" }],
    marks: [{ x: 300, y: 80, label: "Mark" }],
    routes: [
      { points: [[400, 260], [300, 80]], color: "#b5533c", label: "Route A" },
      {
        points: [
          [400, 260],
          [330, 200],
          [400, 150],
          [320, 105],
          [300, 80],
        ],
        color: "#1f6f6b",
        label: "Route B",
      },
      { points: [[400, 260], [60, 240], [55, 60], [300, 80]], color: "#8a4a3c", label: "Route C" },
    ],
    why: "Route A points straight at the mark, but that line runs straight into the No-Go Zone. Route C cuts across the shore on the far side of the lake. Route B tacks upwind in a zigzag, staying on sailable angles the whole way.",
  },
];

export const QUESTIONS: Question[] = [
  ...buildRecallQuestions(),
  ...MANEUVER_QUESTIONS,
  ...POINT_OF_SAIL_QUESTIONS,
  ...buildLabelQuestions(),
  ...buildSkipperViewQuestions(),
  ...buildTackQuestions(),
  ...TRIM_QUESTIONS,
  ...buildTillerDirectionQuestions(),
  ...buildNewPointOfSailQuestions(),
  ...RIGHT_OF_WAY_QUESTIONS,
  ...NAV_MANEUVER_QUESTIONS,
  ...NAV_ROUTE_QUESTIONS,
].filter((q) => !TOPIC_MAP[q.topic]?.hidden);
