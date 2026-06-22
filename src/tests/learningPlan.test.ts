import { describe, expect, it } from "vitest";
import { contentSummary } from "../content/summaryIndex";
import { getDailyExerciseTarget, getNextLessonForLevel } from "../engines/learningPlan";
import { defaultPreferences } from "../services/storage";

describe("learning plan", () => {
  it("starts from the learner's selected level", () => {
    expect(getNextLessonForLevel(contentSummary.courses, [], "CET4").level).toBe("CET4");
    expect(getNextLessonForLevel(contentSummary.courses, [], "TOEFL").level).toBe("TOEFL");
  });

  it("turns daily minutes and energy into a bounded exercise target", () => {
    expect(getDailyExerciseTarget(12, 12, { ...defaultPreferences, dailyMinutes: 5, energy: "steady" })).toBe(5);
    expect(getDailyExerciseTarget(12, 12, { ...defaultPreferences, dailyMinutes: 12, energy: "steady" })).toBe(12);
    expect(getDailyExerciseTarget(12, 12, { ...defaultPreferences, dailyMinutes: 5, energy: "light" })).toBe(4);
  });
});
