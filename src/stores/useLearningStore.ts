import { create } from "zustand";
import type { ExerciseResult, MemoryRecord, UserPreferences } from "../types/content";
import {
  db,
  getPreferences,
  hasSavedPreferences,
  savePreferences,
  type LearningActivity,
  type SavedCourseProgress
} from "../services/storage";
import { updateMemory } from "../engines/masteryEngine";

interface LearningState {
  ready: boolean;
  onboarded: boolean;
  preferences: UserPreferences | null;
  memory: MemoryRecord[];
  progress: SavedCourseProgress[];
  activities: LearningActivity[];
  init: () => Promise<void>;
  setPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  recordResult: (result: ExerciseResult) => Promise<void>;
  saveProgress: (progress: SavedCourseProgress) => Promise<void>;
  recordActivity: (activity: Omit<LearningActivity, "id">) => Promise<void>;
}

let preferencesWriteQueue: Promise<void> = Promise.resolve();
let resultWriteQueue: Promise<void> = Promise.resolve();
let progressWriteQueue: Promise<void> = Promise.resolve();

export const useLearningStore = create<LearningState>((set, get) => ({
  ready: false,
  onboarded: false,
  preferences: null,
  memory: [],
  progress: [],
  activities: [],
  init: async () => {
    const [preferences, onboarded, memory, progress, activities] = await Promise.all([
      getPreferences(),
      hasSavedPreferences(),
      db.memory.toArray(),
      db.progress.toArray(),
      db.activities.orderBy("completedAt").reverse().limit(120).toArray()
    ]);
    set({ ready: true, onboarded, preferences, memory, progress, activities });
  },
  setPreferences: async (preferences) => {
    const base = get().preferences ?? await getPreferences();
    const next = { ...base, ...preferences };
    set({ preferences: next, onboarded: true });
    preferencesWriteQueue = preferencesWriteQueue.then(async () => {
      const latest = get().preferences ?? next;
      await savePreferences(latest);
    });
    await preferencesWriteQueue;
  },
  recordResult: async (result) => {
    resultWriteQueue = resultWriteQueue.then(async () => {
      const duplicate = await db.results.where("exerciseId").equals(result.exerciseId).and((row) => row.answeredAt === result.answeredAt).first();
      if (duplicate) return;
      const existing = get().memory.find((record) => record.knowledgeItemId === result.knowledgeItemId)
        ?? await db.memory.get(result.knowledgeItemId);
      const next = updateMemory(existing, result);
      await db.transaction("rw", db.memory, db.results, async () => {
        await db.memory.put(next);
        await db.results.add(result);
      });
      set((state) => ({
        memory: [...state.memory.filter((record) => record.knowledgeItemId !== next.knowledgeItemId), next]
      }));
    });
    await resultWriteQueue;
  },
  saveProgress: async (progress) => {
    progressWriteQueue = progressWriteQueue.then(async () => {
      const existing = await db.progress.get(progress.lessonId);
      if (existing && new Date(existing.updatedAt).getTime() > new Date(progress.updatedAt).getTime()) return;
      await db.progress.put(progress);
      set((state) => {
        const current = state.progress.find((item) => item.lessonId === progress.lessonId);
        if (current && new Date(current.updatedAt).getTime() > new Date(progress.updatedAt).getTime()) return state;
        return { progress: [...state.progress.filter((item) => item.lessonId !== progress.lessonId), progress] };
      });
    });
    await progressWriteQueue;
  },
  recordActivity: async (activity) => {
    const id = await db.activities.add(activity);
    set({ activities: [{ ...activity, id }, ...get().activities].slice(0, 120) });
  }
}));
