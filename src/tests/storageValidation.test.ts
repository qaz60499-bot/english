import { describe, expect, it } from "vitest";
import { defaultPreferences, validateLearningData } from "../services/storage";

const now = "2026-06-18T00:00:00.000Z";

function validMemory() {
  return {
    knowledgeItemId: "v-0001",
    status: "learning",
    strength: 0.4,
    stability: 1,
    lastReviewedAt: now,
    nextReviewAt: now,
    correctStreak: 1,
    wrongCount: 0,
    hintDependency: 0,
    errorTypes: {},
    skillScores: { vocabulary: 0.5 }
  };
}

function validProgress() {
  return {
    lessonId: "lesson-001",
    currentStep: 0,
    completed: false,
    status: "in_progress",
    startedAt: now,
    updatedAt: now,
    answers: {
      "ex-001-01": {
        exerciseId: "ex-001-01",
        answer: "hola",
        correct: true,
        firstTryCorrect: true,
        attempts: 1,
        submittedAt: now
      }
    }
  };
}

const validPayload = {
  version: 2,
  exportedAt: now,
  memory: [validMemory()],
  results: [{
    exerciseId: "ex-001-01",
    knowledgeItemId: "v-0001",
    skill: "vocabulary",
    correct: true,
    firstTry: true,
    hintCount: 0,
    responseTime: 1200,
    requiresProduction: false,
    answeredAt: now
  }],
  progress: [validProgress()],
  preferences: defaultPreferences,
  favorites: [{ id: "v-0001", type: "vocabulary", createdAt: now }],
  activities: [{ type: "session", referenceId: "lesson-001", itemCount: 4, correctCount: 3, completedAt: now }]
};

describe("learning data import validation", () => {
  it("accepts a complete current-version export", () => {
    expect(validateLearningData(validPayload)).toMatchObject({ version: 2, preferences: defaultPreferences });
  });

  it("rejects missing core tables", () => {
    expect(() => validateLearningData({ version: 2, exportedAt: now, preferences: defaultPreferences })).toThrow(/缺少记忆/);
  });

  it("rejects unsupported export versions", () => {
    expect(() => validateLearningData({ ...validPayload, version: 1 })).toThrow(/第2版/);
  });

  it("rejects out-of-range course steps", () => {
    const progress = [{ ...validProgress(), currentStep: 999 }];
    expect(() => validateLearningData({ ...validPayload, progress })).toThrow(/课程进度.*损坏|课程进度存在/);
  });

  it("rejects answers that do not belong to the saved lesson", () => {
    const progress = [{ ...validProgress(), answers: { "ex-002-01": { ...validProgress().answers["ex-001-01"], exerciseId: "ex-002-01" } } }];
    expect(() => validateLearningData({ ...validPayload, progress })).toThrow(/课程进度.*损坏|课程进度存在/);
  });

  it("rejects incomplete memory records instead of silently filtering them", () => {
    const memory = [{ ...validMemory(), skillScores: undefined }];
    expect(() => validateLearningData({ ...validPayload, memory })).toThrow(/记忆.*损坏|记忆存在/);
  });
});
