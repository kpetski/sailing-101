import type { TopicId } from "./types";

export type GameId = "directionDrill" | "maneuverPractice";

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
];

export const GAME_MAP: Record<GameId, Game> = Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<
  GameId,
  Game
>;
