import { describe, expect, it } from "vitest";
import { createMemoryRecord, updateMemory } from "../engines/masteryEngine";

describe("masteryEngine", () => {
  it("moves a correct answer forward and schedules review", () => {
    const now = new Date("2026-06-18T00:00:00.000Z");
    const record = createMemoryRecord("v-1", now);
    const next = updateMemory(record, {
      exerciseId: "ex-1",
      knowledgeItemId: "v-1",
      skill: "spelling",
      correct: true,
      firstTry: true,
      hintCount: 0,
      responseTime: 4000,
      requiresProduction: true,
      answeredAt: now.toISOString()
    }, now);
    expect(next.strength).toBeGreaterThan(record.strength);
    expect(new Date(next.nextReviewAt).getTime()).toBeGreaterThan(now.getTime());
  });
});
