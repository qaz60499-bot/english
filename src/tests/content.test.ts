import { describe, expect, it } from "vitest";
import { content, contentStats } from "../content/contentIndex";
import { shouldHideAnswerInPrompt } from "../content/exerciseQuality";
import type { Level } from "../types/content";

const levels = new Set<Level>(["BASIC", "CET4", "CET6", "IELTS", "TOEFL"]);
const normalize = (value: string) => value.toLocaleLowerCase("en").normalize("NFC").trim();
const canonical = (value: string) => normalize(value).replace(/[!?.,;:'"()]/g, "").replace(/\s+/g, " ").trim();
const containsAnswer = (text: string, answer: string) => {
  const normalizedAnswer = canonical(answer);
  return normalizedAnswer.length >= 3 && canonical(text).includes(normalizedAnswer);
};

describe("English content bundle", () => {
  it("contains the expanded English learning corpus", () => {
    expect(contentStats.activeVocabulary).toBeGreaterThanOrEqual(2200);
    expect(contentStats.recognitionVocabulary).toBeGreaterThanOrEqual(550);
    expect(contentStats.sentencePatterns).toBeGreaterThanOrEqual(450);
    expect(contentStats.sceneExpressions).toBeGreaterThanOrEqual(1200);
    expect(contentStats.grammar).toBeGreaterThanOrEqual(220);
    expect(contentStats.pronunciation).toBeGreaterThanOrEqual(90);
    expect(contentStats.cultureStories).toBeGreaterThanOrEqual(100);
    expect(contentStats.courses).toBe(288);
    expect(contentStats.exercises).toBe(3456);
  });

  it("uses only the English level system", () => {
    const seen = new Set<Level>();
    for (const item of [
      ...content.vocabulary,
      ...content.sentencePatterns,
      ...content.sceneExpressions,
      ...content.grammar,
      ...content.pronunciation,
      ...content.cultureStories,
      ...content.courses
    ]) {
      expect(levels.has(item.level)).toBe(true);
      seen.add(item.level);
    }
    expect(seen).toEqual(levels);
  });

  it("keeps vocabulary concrete, unique, and English-facing", () => {
    expect(new Set(content.vocabulary.map((item) => normalize(item.displayForm))).size).toBe(content.vocabulary.length);
    expect(content.vocabulary.every((item) => item.examples.length >= 3)).toBe(true);
    expect(content.vocabulary.every((item) => item.collocations.length >= 3)).toBe(true);
    expect(content.vocabulary.some((item) => /[\u4e00-\u9fff]/.test(item.displayForm))).toBe(false);
    expect(content.vocabulary.some((item) => item.collocations.some((value) => /[\u4e00-\u9fff]/.test(value)))).toBe(false);

    const allExamples = content.vocabulary.flatMap((item) => item.examples.map((example) => canonical(example.spanish)));
    const allCollocations = content.vocabulary.flatMap((item) => item.collocations.map(canonical));
    expect(new Set(allExamples).size).toBe(allExamples.length);
    expect(new Set(allCollocations).size).toBe(allCollocations.length);
  });

  it("covers every supported exercise type", () => {
    const types = new Set(content.courses.flatMap((lesson) => lesson.exercises.map((exercise) => exercise.type)));
    expect(types.size).toBe(17);
    expect(types.has("shadowing")).toBe(true);
    expect(types.has("storyRetell")).toBe(true);
    expect(types.has("accentRepair")).toBe(true);
  });

  it("prioritizes audio practice while limiting spelling load", () => {
    for (const lesson of content.courses) {
      const audioExercises = lesson.exercises.filter((exercise) => Boolean(exercise.promptAudioText));
      const spellingExercises = lesson.exercises.filter((exercise) => exercise.skill === "spelling");
      expect(audioExercises.length).toBeGreaterThanOrEqual(7);
      expect(spellingExercises.length).toBeLessThanOrEqual(2);
    }
  });

  it("keeps every lesson internally consistent and knowledge-based", () => {
    const semanticRefs: string[] = [];
    const signatures: string[] = [];
    for (const lesson of content.courses) {
      expect(lesson.exercises).toHaveLength(12);
      expect(levels.has(lesson.level)).toBe(true);
      expect(lesson.realGoal).toContain("场景");
      for (const exercise of lesson.exercises) {
        const refs = exercise.knowledgeRefs.filter((ref) => !ref.startsWith("k-"));
        expect(refs.length).toBeGreaterThan(0);
        semanticRefs.push(...refs);
        signatures.push(`${exercise.type}|${exercise.prompt}|${JSON.stringify(exercise.answer)}`);
        if (exercise.options) {
          const answers = Array.isArray(exercise.answer) ? exercise.answer : [exercise.answer];
          answers.forEach((answer) => expect(exercise.options).toContain(answer));
        }
        if (exercise.type === "imageChoice") {
          expect(exercise.metadata?.visualHint).toBeTruthy();
          expect(exercise.options?.every((option) => Boolean(exercise.visualOptions?.[option]))).toBe(true);
        }
      }
    }
    expect(new Set(semanticRefs).size).toBeGreaterThanOrEqual(900);
    expect(new Set(signatures).size).toBe(signatures.length);
  });

  it("uses analysis-first feedback", () => {
    const exercises = content.courses.flatMap((lesson) => lesson.exercises);
    expect(exercises.every((exercise) => exercise.feedback.full.startsWith("本题分析："))).toBe(true);
  });

  it("keeps question wording independent from the expected response", () => {
    const exercises = content.courses.flatMap((lesson) => lesson.exercises);
    expect(exercises.filter(shouldHideAnswerInPrompt).every((exercise) => {
      const values = Array.isArray(exercise.answer) ? exercise.answer : [exercise.answer];
      return values.every((value) => !containsAnswer(exercise.prompt, value));
    })).toBe(true);
  });

  it("keeps pre-submit guidance free of the expected response", () => {
    const exercises = content.courses.flatMap((lesson) => lesson.exercises);
    expect(exercises.every((exercise) => {
      const values = Array.isArray(exercise.answer) ? exercise.answer : [exercise.answer];
      return values.every((value) => !containsAnswer(exercise.feedback.light, value)
        && !containsAnswer(exercise.feedback.rule, value));
    })).toBe(true);
  });



  it("keeps each pronunciation focus tied to its own practice set", () => {
    const practiceByFocus = new Map<string, string>();
    for (const topic of content.pronunciation) {
      const signature = JSON.stringify([topic.examples, topic.minimalPairs]);
      const existing = practiceByFocus.get(topic.focus);
      if (existing) expect(signature).toBe(existing);
      else practiceByFocus.set(topic.focus, signature);
    }
    expect(practiceByFocus.size).toBe(8);
    expect(new Set(practiceByFocus.values()).size).toBe(practiceByFocus.size);
  });

  it("keeps stories bilingual and interactive", () => {
    for (const story of content.cultureStories) {
      expect(story.spanishParagraphs).toHaveLength(4);
      expect(story.translationZh).toHaveLength(4);
      expect(story.comprehensionExercises).toHaveLength(4);
      story.spanishParagraphs.forEach((paragraph) => {
        expect(paragraph).not.toMatch(/[\u4e00-\u9fff]/);
      });
    }
  });
});
