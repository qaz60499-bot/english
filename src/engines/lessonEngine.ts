import type { Exercise, ExerciseResult } from "../types/content";

export function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("en")
    .normalize("NFC")
    .replace(/[?!.;,:"“”]/g, "")
    .replace(/\s+/g, " ");
}


export function normalizeAccentAnswer(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("en")
    .normalize("NFC")
    .replace(/\s+([?!.;,:"“”])/g, "$1")
    .replace(/\s+/g, " ");
}

export function normalizeWithoutAccents(value: string) {
  return normalizeAnswer(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC");
}


export function resolvePrimaryKnowledgeId(exercise: Exercise) {
  return exercise.knowledgeRefs.find((ref) => !ref.startsWith("k-")) ?? exercise.knowledgeRefs[0] ?? exercise.id;
}

export function formatExerciseAnswer(exercise: Exercise) {
  return Array.isArray(exercise.answer) ? exercise.answer.join("、") : exercise.answer;
}

export function evaluateExercise(exercise: Exercise, rawAnswer: string | string[]) {
  const answer = exercise.answer;
  if (Array.isArray(answer)) {
    const expected = answer.map(normalizeAnswer).sort();
    const actual = (Array.isArray(rawAnswer) ? rawAnswer : [rawAnswer]).map(normalizeAnswer).sort();
    return expected.length === actual.length && expected.every((value, index) => value === actual[index]);
  }

  const actual = Array.isArray(rawAnswer) ? rawAnswer.join(" ") : rawAnswer;

  // 重音修复题必须真的写出重音符号，不能把 cafe 当作 café 判对。
  if (exercise.type === "accentRepair") {
    const accepted = [answer, ...(exercise.acceptableAnswers ?? [])].map(normalizeAccentAnswer);
    return accepted.includes(normalizeAccentAnswer(actual));
  }

  const accepted = [answer, ...(exercise.acceptableAnswers ?? [])].map(normalizeAnswer);
  return accepted.includes(normalizeAnswer(actual));
}

export function buildExerciseResult(params: {
  exercise: Exercise;
  answer: string | string[];
  firstTry: boolean;
  hintCount: number;
  startedAt: number;
  correctOverride?: boolean;
}): ExerciseResult {
  const correct = params.correctOverride ?? evaluateExercise(params.exercise, params.answer);
  return {
    exerciseId: params.exercise.id,
    knowledgeItemId: resolvePrimaryKnowledgeId(params.exercise),
    skill: params.exercise.skill,
    correct,
    firstTry: params.firstTry,
    hintCount: params.hintCount,
    responseTime: Date.now() - params.startedAt,
    requiresProduction: ["freeInput", "storyRetell", "shadowing", "sentenceBuild", "sentenceDictation"].includes(params.exercise.type),
    errorType: correct ? undefined : inferErrorType(params.exercise, params.answer),
    answeredAt: new Date().toISOString()
  };
}

export function inferErrorType(exercise: Exercise, rawAnswer: string | string[]) {
  const actual = Array.isArray(rawAnswer) ? rawAnswer.join(" ") : rawAnswer;
  const expected = Array.isArray(exercise.answer) ? exercise.answer.join(" ") : exercise.answer;
  if (normalizeWithoutAccents(actual) === normalizeWithoutAccents(expected) && normalizeAnswer(actual) !== normalizeAnswer(expected)) return "accent";
  if (exercise.type.includes("listen") || exercise.type === "sentenceDictation") return "listening";
  if (["conjugation", "errorCorrection", "fillBlank", "sentenceBuild"].includes(exercise.type)) return "grammar";
  if (exercise.type === "accentRepair") return "accent";
  if (exercise.type === "wordDictation" || exercise.type === "letterOrder") return "spelling";
  return "meaning";
}
