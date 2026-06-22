import summary from "./generated/summary.json";
import type { Level } from "../types/content";

export interface CourseSummary {
  id: string;
  title: string;
  level: Level;
  unit: string;
  minutes: number;
  realGoal: string;
  exerciseCount: number;
}

export const contentSummary = summary as {
  stats: {
    activeVocabulary: number;
    recognitionVocabulary: number;
    sentencePatterns: number;
    sceneExpressions: number;
    grammar: number;
    pronunciation: number;
    cultureStories: number;
    courses: number;
    exercises: number;
  };
  courses: CourseSummary[];
};
