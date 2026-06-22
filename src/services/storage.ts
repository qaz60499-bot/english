import Dexie, { type Table } from "dexie";
import type { ExerciseResult, MemoryRecord, Skill, UserPreferences } from "../types/content";

export interface SavedCourseProgress {
  lessonId: string;
  currentStep: number;
  completed: boolean;
  status?: "in_progress" | "completed" | "relearning";
  startedAt?: string;
  answers?: Record<string, SavedExerciseAnswer>;
  updatedAt: string;
}

export interface SavedExerciseAnswer {
  exerciseId: string;
  answer: string | string[];
  /** 当前最近一次作答是否正确。 */
  correct: boolean;
  /** 第一次提交是否正确，用于区分“首次掌握”和“订正掌握”。 */
  firstTryCorrect?: boolean;
  /** 曾经答错、跳过，后来订正正确。 */
  corrected?: boolean;
  skipped?: boolean;
  attempts: number;
  /** 最近一次提交时间；旧版本数据仍可直接读取。 */
  submittedAt: string;
}

export interface LearningActivity {
  id?: number;
  type: "lesson" | "review" | "session";
  mode?: "due" | "mistakes" | "practice";
  referenceId?: string;
  itemCount: number;
  correctCount: number;
  completedAt: string;
}

export interface LearningDataExport {
  version: 2;
  exportedAt: string;
  memory: MemoryRecord[];
  results: ExerciseResult[];
  progress: SavedCourseProgress[];
  preferences: UserPreferences;
  favorites: { id: string; type: string; createdAt: string }[];
  activities: LearningActivity[];
}

export const defaultPreferences: UserPreferences = {
  goal: "每天用 10 分钟听懂并说出真实英语句子",
  level: "BASIC",
  dailyMinutes: 10,
  accent: "auto",
  energy: "steady",
  theme: "system",
  reduceMotion: false
};

class EnglishPlanetDatabase extends Dexie {
  memory!: Table<MemoryRecord, string>;
  results!: Table<ExerciseResult, number>;
  progress!: Table<SavedCourseProgress, string>;
  preferences!: Table<{ id: string; value: UserPreferences }, string>;
  favorites!: Table<{ id: string; type: string; createdAt: string }, string>;
  activities!: Table<LearningActivity, number>;

  constructor() {
    super("english-planet");
    this.version(1).stores({
      memory: "knowledgeItemId,nextReviewAt,status",
      results: "++id,exerciseId,knowledgeItemId,answeredAt,skill",
      progress: "lessonId,updatedAt,completed",
      preferences: "id",
      favorites: "id,type,createdAt"
    });
    this.version(2).stores({
      memory: "knowledgeItemId,nextReviewAt,status",
      results: "++id,exerciseId,knowledgeItemId,answeredAt,skill",
      progress: "lessonId,updatedAt,completed",
      preferences: "id",
      favorites: "id,type,createdAt",
      activities: "++id,completedAt,type,mode,referenceId"
    });
  }
}

export const db = new EnglishPlanetDatabase();

export async function getPreferences() {
  const row = await db.preferences.get("main");
  return row?.value ?? defaultPreferences;
}

export async function hasSavedPreferences() {
  return Boolean(await db.preferences.get("main"));
}

export async function savePreferences(value: UserPreferences) {
  await db.preferences.put({ id: "main", value });
}

export async function exportLearningData(): Promise<LearningDataExport> {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    memory: await db.memory.toArray(),
    results: await db.results.toArray(),
    progress: await db.progress.toArray(),
    preferences: await getPreferences(),
    favorites: await db.favorites.toArray(),
    activities: await db.activities.toArray()
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isFiniteNumber(value: unknown, minimum = Number.NEGATIVE_INFINITY) {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum;
}

function isInteger(value: unknown, minimum = Number.NEGATIVE_INFINITY, maximum = Number.POSITIVE_INFINITY) {
  return Number.isInteger(value) && Number(value) >= minimum && Number(value) <= maximum;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every((item) => isFiniteNumber(item, 0));
}

function isPreferences(value: unknown): value is UserPreferences {
  if (!isRecord(value)) return false;
  return (
    typeof value.goal === "string" && value.goal.trim().length > 0 && value.goal.length <= 240 &&
    ["BASIC", "CET4", "CET6", "IELTS", "TOEFL"].includes(String(value.level)) &&
    isInteger(value.dailyMinutes, 5, 120) &&
    ["en-US", "en-GB", "auto"].includes(String(value.accent)) &&
    ["light", "steady", "challenge"].includes(String(value.energy)) &&
    ["light", "dark", "system"].includes(String(value.theme)) &&
    typeof value.reduceMotion === "boolean"
  );
}

function isLessonId(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^lesson-(\d{3})$/.exec(value);
  return Boolean(match && Number(match[1]) >= 1 && Number(match[1]) <= 288);
}

function isCourseExerciseId(value: unknown, lessonId?: string): value is string {
  if (typeof value !== "string") return false;
  const match = /^ex-(\d{3})-(\d{2})$/.exec(value);
  if (!match) return false;
  const lessonNumber = Number(match[1]);
  const exerciseNumber = Number(match[2]);
  if (lessonNumber < 1 || lessonNumber > 288 || exerciseNumber < 1 || exerciseNumber > 12) return false;
  return !lessonId || lessonId === `lesson-${match[1]}`;
}

function isStoryExerciseId(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^story-ex-(\d{2,3})-(\d{2})$/.exec(value);
  return Boolean(match && Number(match[1]) >= 1 && Number(match[1]) <= 120 && Number(match[2]) >= 1 && Number(match[2]) <= 4);
}

function isExerciseId(value: unknown): value is string {
  return isCourseExerciseId(value) || isStoryExerciseId(value);
}

function inRangeId(value: string, pattern: RegExp, minimum: number, maximum: number) {
  const match = pattern.exec(value);
  return Boolean(match && Number(match[1]) >= minimum && Number(match[1]) <= maximum);
}

function isKnowledgeId(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return (
    inRangeId(value, /^v-(\d{4})$/, 1, 2304) ||
    inRangeId(value, /^rv-(\d{4})$/, 2305, 2880) ||
    inRangeId(value, /^p-(\d{4})$/, 1, 480) ||
    inRangeId(value, /^s-(\d{4})$/, 1, 1440) ||
    inRangeId(value, /^g-(\d{3})$/, 1, 240) ||
    inRangeId(value, /^pr-(\d{2,3})$/, 1, 96) ||
    /^k-lesson-(?:00[1-9]|0[1-9]\d|1\d\d|2[0-7]\d|28[0-8])-(?:0[1-9]|1[0-2])$/.test(value) ||
    /^k-story-(?:0[1-9]|[1-9]\d|1[01]\d|120)-(?:0[1-4])$/.test(value)
  );
}

const skills: Skill[] = ["listening", "speaking", "spelling", "grammar", "reading", "vocabulary"];

function isMemoryRecord(value: unknown): value is MemoryRecord {
  if (!isRecord(value)) return false;
  return (
    isKnowledgeId(value.knowledgeItemId) &&
    ["new", "learning", "familiar", "strong", "review", "leech"].includes(String(value.status)) &&
    isFiniteNumber(value.strength, 0) &&
    isFiniteNumber(value.stability, 0) &&
    (value.lastReviewedAt === undefined || isIsoDate(value.lastReviewedAt)) &&
    isIsoDate(value.nextReviewAt) &&
    isInteger(value.correctStreak, 0) &&
    isInteger(value.wrongCount, 0) &&
    isFiniteNumber(value.hintDependency, 0) && Number(value.hintDependency) <= 10 &&
    isNumberRecord(value.errorTypes) &&
    isNumberRecord(value.skillScores)
  );
}

function isExerciseResult(value: unknown): value is ExerciseResult {
  if (!isRecord(value)) return false;
  return (
    isExerciseId(value.exerciseId) &&
    isKnowledgeId(value.knowledgeItemId) &&
    skills.includes(value.skill as Skill) &&
    typeof value.correct === "boolean" &&
    typeof value.firstTry === "boolean" &&
    isInteger(value.hintCount, 0, 100) &&
    isFiniteNumber(value.responseTime, 0) &&
    typeof value.requiresProduction === "boolean" &&
    (value.errorType === undefined || typeof value.errorType === "string") &&
    isIsoDate(value.answeredAt)
  );
}

function isSavedExerciseAnswer(value: unknown, lessonId: string, key: string): value is SavedExerciseAnswer {
  if (!isRecord(value)) return false;
  const answerValid = typeof value.answer === "string" || isStringArray(value.answer);
  return (
    value.exerciseId === key &&
    isCourseExerciseId(value.exerciseId, lessonId) &&
    answerValid &&
    typeof value.correct === "boolean" &&
    (value.firstTryCorrect === undefined || typeof value.firstTryCorrect === "boolean") &&
    (value.corrected === undefined || typeof value.corrected === "boolean") &&
    (value.skipped === undefined || typeof value.skipped === "boolean") &&
    isInteger(value.attempts, 0, 100) &&
    isIsoDate(value.submittedAt)
  );
}

function isSavedCourseProgress(value: unknown): value is SavedCourseProgress {
  if (!isRecord(value) || !isLessonId(value.lessonId)) return false;
  if (!isInteger(value.currentStep, 0, 11) || typeof value.completed !== "boolean" || !isIsoDate(value.updatedAt)) return false;
  if (value.status !== undefined && !["in_progress", "completed", "relearning"].includes(String(value.status))) return false;
  if (value.startedAt !== undefined && !isIsoDate(value.startedAt)) return false;
  if (value.completed && value.status !== undefined && value.status !== "completed") return false;
  if (value.answers !== undefined) {
    if (!isRecord(value.answers)) return false;
    const entries = Object.entries(value.answers);
    if (entries.length > 12 || !entries.every(([key, answer]) => isSavedExerciseAnswer(answer, value.lessonId as string, key))) return false;
  }
  return true;
}

function isFavorite(value: unknown): value is { id: string; type: string; createdAt: string } {
  if (!isRecord(value) || typeof value.id !== "string" || !isIsoDate(value.createdAt)) return false;
  const type = String(value.type);
  const validType = ["vocabulary", "pattern", "expression", "grammar", "pronunciation", "story"].includes(type);
  if (!validType) return false;
  if (type === "vocabulary") return /^r?v-\d{4}$/.test(value.id);
  if (type === "pattern") return /^p-\d{4}$/.test(value.id);
  if (type === "expression") return /^s-\d{4}$/.test(value.id);
  if (type === "grammar") return /^g-\d{3}$/.test(value.id);
  if (type === "pronunciation") return /^pr-\d{2,3}$/.test(value.id);
  return /^story-\d{2,3}$/.test(value.id);
}

function isLearningActivity(value: unknown): value is LearningActivity {
  if (!isRecord(value)) return false;
  const type = String(value.type);
  if (!["lesson", "review", "session"].includes(type)) return false;
  if (value.id !== undefined && !isInteger(value.id, 1)) return false;
  if (value.mode !== undefined && !["due", "mistakes", "practice"].includes(String(value.mode))) return false;
  if (value.referenceId !== undefined && typeof value.referenceId !== "string") return false;
  if (!isInteger(value.itemCount, 0, 10000) || !isInteger(value.correctCount, 0, Number(value.itemCount))) return false;
  if (!isIsoDate(value.completedAt)) return false;
  if (type === "lesson" && value.referenceId !== undefined && !isLessonId(value.referenceId)) return false;
  return true;
}

function assertAllRows<T>(value: unknown, validator: (row: unknown) => row is T, tableName: string): T[] {
  if (!Array.isArray(value)) throw new Error(`文件缺少${tableName}数据。`);
  if (!value.every(validator)) throw new Error(`文件中的${tableName}存在损坏、越界或与当前课程不兼容的记录。`);
  return value;
}

export function validateLearningData(payload: unknown): LearningDataExport {
  if (!isRecord(payload)) throw new Error("文件内容不是有效的学习数据。");
  if (payload.version !== 2) throw new Error("只支持当前第2版学习数据，请先在原设备升级后重新导出。");
  if (!isIsoDate(payload.exportedAt)) throw new Error("导出时间无效，文件可能已损坏。");
  if (!isPreferences(payload.preferences)) throw new Error("文件中的学习设置无效或版本不兼容。");

  const memory = assertAllRows(payload.memory, isMemoryRecord, "记忆");
  const results = assertAllRows(payload.results, isExerciseResult, "答题");
  const progress = assertAllRows(payload.progress, isSavedCourseProgress, "课程进度");
  const favorites = assertAllRows(payload.favorites ?? [], isFavorite, "收藏");
  const activities = assertAllRows(payload.activities ?? [], isLearningActivity, "学习活动");

  const duplicatedMemory = new Set(memory.map((row) => row.knowledgeItemId)).size !== memory.length;
  const duplicatedProgress = new Set(progress.map((row) => row.lessonId)).size !== progress.length;
  if (duplicatedMemory || duplicatedProgress) throw new Error("文件中存在重复的记忆或课程进度记录，已停止导入。");

  return {
    version: 2,
    exportedAt: payload.exportedAt,
    memory,
    results,
    progress,
    preferences: payload.preferences,
    favorites,
    activities
  };
}

export async function importLearningData(payload: unknown) {
  const data = validateLearningData(payload);
  await db.transaction("rw", [db.memory, db.results, db.progress, db.preferences, db.favorites, db.activities], async () => {
    await db.memory.clear();
    await db.results.clear();
    await db.progress.clear();
    await db.favorites.clear();
    await db.activities.clear();
    await db.memory.bulkPut(data.memory);
    await db.results.bulkPut(data.results);
    await db.progress.bulkPut(data.progress);
    await db.preferences.put({ id: "main", value: data.preferences });
    await db.favorites.bulkPut(data.favorites);
    await db.activities.bulkPut(data.activities.map(({ id: _id, ...activity }) => activity));
  });
}

export async function clearLearningData() {
  await db.transaction("rw", [db.memory, db.results, db.progress, db.preferences, db.favorites, db.activities], async () => {
    await db.memory.clear();
    await db.results.clear();
    await db.progress.clear();
    await db.favorites.clear();
    await db.activities.clear();
    await db.preferences.clear();
  });
}
