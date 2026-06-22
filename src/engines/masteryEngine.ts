import type { ExerciseResult, MemoryRecord, MemoryStatus } from "../types/content";

const intervalsInDays = [0.007, 1, 3, 7, 14, 30, 60];

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function createMemoryRecord(knowledgeItemId: string, now = new Date()): MemoryRecord {
  return {
    knowledgeItemId,
    status: "new",
    strength: 0,
    stability: 0,
    nextReviewAt: now.toISOString(),
    correctStreak: 0,
    wrongCount: 0,
    hintDependency: 0,
    errorTypes: {},
    skillScores: {}
  };
}

export function scoreResult(result: Pick<ExerciseResult, "correct" | "firstTry" | "hintCount" | "responseTime" | "requiresProduction">) {
  const speedBonus = result.responseTime < 9000 ? 4 : result.responseTime > 30000 ? -3 : 0;
  const productionBonus = result.requiresProduction ? 5 : 0;
  const hintPenalty = result.hintCount * 4;
  const firstTryBonus = result.firstTry ? 5 : -4;
  const delta = result.correct ? 12 + speedBonus + productionBonus + firstTryBonus - hintPenalty : -16 - hintPenalty;
  return { delta, hintPenalty };
}

export function calculateStatus(item: MemoryRecord): MemoryStatus {
  if (item.wrongCount >= 3 && item.strength < 45) return "leech";
  if (item.wrongCount > 0 && item.correctStreak === 0) return "review";
  if (item.strength >= 82 && item.correctStreak >= 4) return "strong";
  if (item.strength >= 45) return "familiar";
  if (item.strength > 0) return "learning";
  return "new";
}

export function calculateNextReview(item: MemoryRecord, now = new Date()) {
  const index = clamp(Math.floor(item.strength / 15), 0, intervalsInDays.length - 1);
  const penalty = item.status === "review" || item.status === "leech" ? 0.35 : 1;
  const intervalMs = intervalsInDays[index] * penalty * 24 * 60 * 60 * 1000;
  return new Date(now.getTime() + intervalMs).toISOString();
}

export function updateMemory(record: MemoryRecord | undefined, result: ExerciseResult, now = new Date()): MemoryRecord {
  const item = record ? { ...record } : createMemoryRecord(result.knowledgeItemId, now);
  const quality = scoreResult(result);
  item.strength = clamp(item.strength + quality.delta, 0, 100);
  item.stability = clamp(item.stability + (result.correct ? 1.2 : -0.8), 0, 12);
  item.correctStreak = result.correct ? item.correctStreak + 1 : 0;
  item.wrongCount += result.correct ? 0 : 1;
  item.hintDependency = clamp(item.hintDependency + result.hintCount - (result.correct && result.hintCount === 0 ? 1 : 0), 0, 10);
  item.lastReviewedAt = result.answeredAt;
  item.skillScores = {
    ...item.skillScores,
    [result.skill]: clamp((item.skillScores[result.skill] ?? 0) + quality.delta, 0, 100)
  };
  if (result.errorType) {
    item.errorTypes = { ...item.errorTypes, [result.errorType]: (item.errorTypes[result.errorType] ?? 0) + 1 };
  }
  item.status = calculateStatus(item);
  item.nextReviewAt = calculateNextReview(item, now);
  return item;
}
