import { describe, expect, it } from "vitest";
import { evaluateExercise, inferErrorType, resolvePrimaryKnowledgeId } from "../engines/lessonEngine";
import type { Exercise } from "../types/content";

const baseExercise: Exercise = {
  id: "test",
  type: "accentRepair",
  prompt: "补上重音",
  answer: "café",
  acceptableAnswers: [],
  skill: "spelling",
  knowledgeRefs: ["v-1"],
  feedback: { light: "看重音", rule: "最后音节重读", full: "需要写成 café。" }
};

describe("lessonEngine", () => {
  it("accepts normalized punctuation and case", () => {
    expect(evaluateExercise({ ...baseExercise, type: "singleChoice", answer: "Hello" }, "hello!")).toBe(true);
  });

  it("requires the accent mark in accent repair exercises", () => {
    expect(evaluateExercise(baseExercise, "cafe")).toBe(false);
    expect(evaluateExercise(baseExercise, "CAFÉ!")).toBe(false);
    expect(evaluateExercise(baseExercise, "CAFÉ")).toBe(true);
  });

  it("requires punctuation when accent repair asks for punctuation", () => {
    const punctuationExercise: Exercise = { ...baseExercise, answer: "How are you?", acceptableAnswers: [] };
    expect(evaluateExercise(punctuationExercise, "How are you")).toBe(false);
    expect(evaluateExercise(punctuationExercise, "How are you?")).toBe(true);
  });

  it("detects missing accents as an accent error", () => {
    expect(inferErrorType(baseExercise, "cafe")).toBe("accent");
  });

  it("stores mastery against a shared content item instead of the question id", () => {
    expect(resolvePrimaryKnowledgeId({ ...baseExercise, knowledgeRefs: ["v-1", "k-lesson-001-01"] })).toBe("v-1");
    expect(resolvePrimaryKnowledgeId({ ...baseExercise, knowledgeRefs: ["k-lesson-001-01"] })).toBe("k-lesson-001-01");
  });
});
