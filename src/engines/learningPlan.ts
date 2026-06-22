import type { CourseSummary } from "../content/summaryIndex";
import type { Level, UserPreferences } from "../types/content";
import type { SavedCourseProgress } from "../services/storage";

const levelOrder: Level[] = ["BASIC", "CET4", "CET6", "IELTS", "TOEFL"];

export function getDailyExerciseTarget(totalExercises: number, lessonMinutes: number, preferences?: UserPreferences | null) {
  if (totalExercises <= 0) return 0;
  const dailyMinutes = preferences?.dailyMinutes ?? 10;
  const base = Math.round(totalExercises * Math.min(1, dailyMinutes / Math.max(lessonMinutes, 1)));
  const energyAdjustment = preferences?.energy === "light" ? -1 : preferences?.energy === "challenge" ? 1 : 0;
  return Math.max(Math.min(4, totalExercises), Math.min(totalExercises, base + energyAdjustment));
}

export function getNextLessonForLevel(
  courses: CourseSummary[],
  progress: SavedCourseProgress[],
  preferredLevel: Level = "BASIC"
) {
  const completed = new Set(progress.filter((item) => item.completed).map((item) => item.lessonId));
  const exactLevel = courses.filter((lesson) => lesson.level === preferredLevel);
  const nextExact = exactLevel.find((lesson) => !completed.has(lesson.id));
  if (nextExact) return nextExact;

  const preferredIndex = levelOrder.indexOf(preferredLevel);
  const fallbackLevels = [...levelOrder.slice(preferredIndex + 1), ...levelOrder.slice(0, preferredIndex)];
  for (const level of fallbackLevels) {
    const next = courses.find((lesson) => lesson.level === level && !completed.has(lesson.id));
    if (next) return next;
  }
  return exactLevel[0] ?? courses[0];
}

export function getRecentProgressForLevel(
  progress: SavedCourseProgress[],
  courses: CourseSummary[],
  preferredLevel: Level = "BASIC"
) {
  const courseIds = new Set(courses.filter((lesson) => lesson.level === preferredLevel).map((lesson) => lesson.id));
  return [...progress]
    .filter((item) => courseIds.has(item.lessonId) && !item.completed && (item.currentStep > 0 || Object.keys(item.answers ?? {}).length > 0))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
}
