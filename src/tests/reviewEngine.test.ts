import { describe, expect, it } from "vitest";
import { content } from "../content/contentIndex";
import { createMemoryRecord } from "../engines/masteryEngine";
import { selectReviewExercises } from "../engines/reviewEngine";
import type { UserPreferences } from "../types/content";

const preferences: UserPreferences = {
  goal: "test",
  level: "BASIC",
  dailyMinutes: 10,
  accent: "auto",
  energy: "steady",
  theme: "system",
  reduceMotion: false
};

describe("reviewEngine modes", () => {
  it("does not insert free practice into an empty due queue", () => {
    expect(selectReviewExercises(content, [], preferences, 8, "due")).toEqual([]);
    expect(selectReviewExercises(content, [], preferences, 8, "practice").length).toBeGreaterThan(0);
  });

  it("keeps mistake practice separate from scheduled review", () => {
    const record = createMemoryRecord(content.courses[0].exercises[0].knowledgeRefs.find((ref) => !ref.startsWith("k-"))!, new Date("2026-06-18T00:00:00.000Z"));
    record.wrongCount = 2;
    record.status = "review";
    record.nextReviewAt = "2099-01-01T00:00:00.000Z";
    expect(selectReviewExercises(content, [record], preferences, 8, "due")).toEqual([]);
    expect(selectReviewExercises(content, [record], preferences, 8, "mistakes").length).toBeGreaterThan(0);
  });
});
