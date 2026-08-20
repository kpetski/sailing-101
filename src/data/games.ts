import type { TopicId } from "./types";

export type GameId = "directionDrill" | "maneuverPractice" | "navigatePractice" | "chartCourse";

export interface Game {
  id: GameId;
  title: string;
  blurb: string;
  /** Reference topics this game draws on — surfaced as "review this" links on the game's page. */
  relatedTopics: TopicId[];
}

export const GAMES: Game[] = [
  {
    id: "directionDrill",
    title: "Direction Drill",
    blurb: "A random caller for bow, stern, port, and starboard — react with the motion, no looking required.",
    relatedTopics: ["nomenclature"],
  },
  {
    id: "maneuverPractice",
    title: "Maneuver Practice",
    blurb: "Drag the telltale to a new point of sail, then call the tiller, sheet, and the maneuver's name.",
    relatedTopics: ["sailTrim", "tackingJibing", "pointsOfSail"],
  },
  {
    id: "navigatePractice",
    title: "Navigate",
    blurb: "Given a starting point of sail and a goal, steer there one real move at a time with the tiller and crew.",
    relatedTopics: ["sailTrim", "tackingJibing", "pointsOfSail"],
  },
  {
    id: "chartCourse",
    title: "Chart a Course",
    blurb: "Sail your boat across a map to reach a mark, tacking and jibing as needed with the same tiller and crew controls.",
    relatedTopics: ["sailTrim", "tackingJibing", "pointsOfSail"],
  },
];

export const GAME_MAP: Record<GameId, Game> = Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<
  GameId,
  Game
>;
