import type { Topic, TopicId } from "./types";

export const TOPICS: Topic[] = [
  {
    id: "nomenclature",
    title: "Boat Nomenclature",
    blurb: "Bow, stern, port, starboard, and the parts of the hull.",
  },
  {
    id: "rig",
    title: "Rig Parts",
    blurb: "Sails, spars, lines, and hardware that make the boat go.",
  },
  {
    id: "pointsOfSail",
    title: "Points of Sail",
    blurb: "Irons (No-Go Zone), close reach, beam reach, broad reach, and run.",
  },
  {
    id: "tackingJibing",
    title: "Tacking vs. Jibing",
    blurb: "Bow-through vs. stern-through the wind, tacks, heading up, falling off.",
  },
  {
    id: "sailTrim",
    title: "Sail Trim",
    blurb: "Sheeting in and out, and the safety position.",
  },
  {
    id: "rightOfWay",
    title: "Right of Way",
    blurb: "COLREGS basics for avoiding collisions under sail.",
  },
  {
    id: "dockingCOB",
    title: "Docking & Crew Overboard",
    blurb: "Leaving the dock, mooring basics, and crew-overboard recovery.",
  },
  {
    id: "threeKeyQuestions",
    title: "The Three Key Questions",
    blurb: "The running checklist every helmsperson asks, constantly.",
  },
];

export const TOPIC_MAP: Record<TopicId, Topic> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t])
) as Record<TopicId, Topic>;
