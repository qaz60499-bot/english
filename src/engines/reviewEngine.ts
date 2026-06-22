import type { ContentBundle, Exercise, Level, MemoryRecord, UserPreferences } from "../types/content";

export type ReviewMode = "due" | "mistakes" | "practice";

export function getDueRecords(records: MemoryRecord[], now = new Date()) {
  return records
    .filter((record) => new Date(record.nextReviewAt).getTime() <= now.getTime())
    .sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime());
}

export function getMistakeRecords(records: MemoryRecord[]) {
  return records
    .filter((record) => record.wrongCount > 0 && record.status !== "strong")
    .sort((a, b) => {
      if (a.status === "leech" && b.status !== "leech") return -1;
      if (b.status === "leech" && a.status !== "leech") return 1;
      return b.wrongCount - a.wrongCount;
    });
}

function uniqueExercises(exercises: Exercise[], limit: number) {
  const seen = new Set<string>();
  return exercises.filter((exercise) => {
    if (seen.has(exercise.id)) return false;
    seen.add(exercise.id);
    return true;
  }).slice(0, limit);
}

function semanticRefs(exercise: Exercise) {
  return exercise.knowledgeRefs.filter((ref) => !ref.startsWith("k-"));
}

const errorTypesBySkill: Record<Exercise["skill"], string[]> = {
  listening: ["listening"],
  speaking: ["meaning", "grammar", "accent"],
  spelling: ["spelling", "accent"],
  grammar: ["grammar"],
  reading: ["meaning", "grammar"],
  vocabulary: ["meaning", "spelling"]
};

function scoreCandidate(exercise: Exercise, record: MemoryRecord) {
  const skillScore = record.skillScores[exercise.skill] ?? 0;
  const productionBoost = exercise.skill === "speaking" || exercise.skill === "spelling" || exercise.skill === "grammar" ? -8 : 0;
  const repeatedErrorCount = errorTypesBySkill[exercise.skill].reduce((sum, key) => sum + (record.errorTypes[key] ?? 0), 0);
  const repeatedErrorBoost = repeatedErrorCount > 0 ? -Math.min(12, 4 + repeatedErrorCount * 2) : 0;
  return skillScore + productionBoost + repeatedErrorBoost;
}

/**
 * 每个知识点先抽一题，避免一个知识点把整轮复习占满；
 * 同一知识点有多种题型时，优先抽用户更薄弱、需要主动输出的题型。
 */
function selectByRecords(content: ContentBundle, records: MemoryRecord[], limit: number) {
  const exercises = content.courses.flatMap((lesson) => lesson.exercises);
  const selected: Exercise[] = [];
  const usedExercises = new Set<string>();

  for (const record of records) {
    if (selected.length >= limit) break;
    const candidates = exercises
      .filter((exercise) => semanticRefs(exercise).includes(record.knowledgeItemId))
      .filter((exercise) => !usedExercises.has(exercise.id))
      .sort((a, b) => scoreCandidate(a, record) - scoreCandidate(b, record));
    const choice = candidates[0];
    if (!choice) continue;
    selected.push(choice);
    usedExercises.add(choice.id);
  }

  if (selected.length < limit) {
    const recordIds = new Set(records.map((record) => record.knowledgeItemId));
    for (const exercise of exercises) {
      if (selected.length >= limit) break;
      if (usedExercises.has(exercise.id)) continue;
      if (!semanticRefs(exercise).some((ref) => recordIds.has(ref))) continue;
      selected.push(exercise);
      usedExercises.add(exercise.id);
    }
  }

  return selected;
}

export function selectDueExercises(content: ContentBundle, records: MemoryRecord[], limit = 12, now = new Date()) {
  return selectByRecords(content, getDueRecords(records, now), limit);
}

export function selectMistakeExercises(content: ContentBundle, records: MemoryRecord[], limit = 12) {
  return selectByRecords(content, getMistakeRecords(records), limit);
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function dailyShuffle(exercises: Exercise[], seed: string) {
  return [...exercises].sort((a, b) => stableHash(`${seed}-${a.id}`) - stableHash(`${seed}-${b.id}`));
}

export function selectPracticeExercises(content: ContentBundle, records: MemoryRecord[], level: Level, limit = 12) {
  const seenKnowledge = new Set(records.map((record) => record.knowledgeItemId));
  const levelLessons = content.courses.filter((lesson) => lesson.level === level);
  const allLessons = levelLessons.length > 0 ? levelLessons : content.courses;
  const newExercises = allLessons
    .flatMap((lesson) => lesson.exercises)
    .filter((exercise) => !semanticRefs(exercise).some((ref) => seenKnowledge.has(ref)));
  const todaySeed = `${new Date().toISOString().slice(0, 10)}-${level}-${records.length}`;
  if (newExercises.length > 0) return uniqueExercises(dailyShuffle(newExercises, todaySeed), limit);
  return uniqueExercises(dailyShuffle(allLessons.flatMap((lesson) => lesson.exercises), todaySeed), limit);
}

export function selectReviewExercises(
  content: ContentBundle,
  records: MemoryRecord[],
  preferences: UserPreferences,
  limit = 12,
  mode: ReviewMode = "due"
): Exercise[] {
  const energyLimit = preferences.energy === "light" ? Math.min(limit, 6) : limit;
  const timeLimit = Math.max(4, Math.min(energyLimit, Math.round(preferences.dailyMinutes * 0.8)));
  if (mode === "mistakes") return selectMistakeExercises(content, records, timeLimit);
  if (mode === "practice") return selectPracticeExercises(content, records, preferences.level, timeLimit);
  return selectDueExercises(content, records, timeLimit);
}

export function explainReviewReason(record?: MemoryRecord) {
  if (!record) return "这是自由练习内容，不会伪装成到期复习。";
  if (record.status === "leech") return "这个项目多次卡住，今天会换一种题型重新建立理解。";
  if (record.status === "review") return "上次出现混淆，今天缩短间隔并再次订正。";
  if (record.hintDependency > 4) return "你能认出它，但提示依赖偏高，今天尝试少看中文。";
  return "它已经到达间隔复习时间，现在复习最合适。";
}
