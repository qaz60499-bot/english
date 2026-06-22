export type Level = "BASIC" | "CET4" | "CET6" | "IELTS" | "TOEFL";

export type Skill = "listening" | "speaking" | "spelling" | "grammar" | "reading" | "vocabulary";

export type ExerciseType =
  | "singleChoice"
  | "multiChoice"
  | "listenWord"
  | "listenSentence"
  | "imageChoice"
  | "letterOrder"
  | "wordDictation"
  | "sentenceDictation"
  | "fillBlank"
  | "sentenceBuild"
  | "conjugation"
  | "errorCorrection"
  | "accentRepair"
  | "shadowing"
  | "branchDialogue"
  | "freeInput"
  | "storyRetell";

export interface ExampleSentence {
  spanish: string;
  zh: string;
  literal?: string;
  wordNotes?: WordNote[];
}

export interface WordNote {
  token: string;
  lemma: string;
  partOfSpeech: string;
  meaningZh: string;
}

export interface VocabularyItem {
  id: string;
  lemma: string;
  displayForm: string;
  partOfSpeech: string;
  gender?: "m" | "f" | "common";
  plural?: string;
  level: Level;
  active: boolean;
  meaningsZh: string[];
  syllables: string[];
  stressedSyllable: number;
  audioText: string;
  accentVariants?: { region: string; audioText: string; note: string }[];
  examples: ExampleSentence[];
  collocations: string[];
  confusionWith?: string[];
  tags: string[];
}

export interface PatternSlot {
  name: string;
  options: string[];
}

export interface CommonError {
  wrong: string;
  fix: string;
  reasonZh: string;
}

export interface SentencePattern {
  id: string;
  pattern: string;
  meaningZh: string;
  usageNote: string;
  register: "neutral" | "formal" | "informal";
  level: Level;
  slots: PatternSlot[];
  examples: ExampleSentence[];
  commonErrors: CommonError[];
  tags: string[];
}

export interface GrammarPoint {
  id: string;
  title: string;
  level: Level;
  ability: string;
  oneLineZh: string;
  scene: ExampleSentence[];
  formula: string;
  examples: ExampleSentence[];
  commonErrors: CommonError[];
  microExercises: string[];
}

export interface PronunciationTopic {
  id: string;
  title: string;
  level: Level;
  focus: string;
  explanationZh: string;
  examples: string[];
  minimalPairs: string[];
  selfCheck: string[];
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  promptAudioText?: string;
  options?: string[];
  answer: string | string[];
  acceptableAnswers?: string[];
  skill: Skill;
  knowledgeRefs: string[];
  feedback: {
    light: string;
    rule: string;
    full: string;
  };
  metadata?: Record<string, string | number | boolean>;
  visualOptions?: Record<string, { emoji: string; label: string; descriptionZh?: string }>;
}

export interface Lesson {
  id: string;
  title: string;
  level: Level;
  unit: string;
  minutes: number;
  realGoal: string;
  dialogue: ExampleSentence[];
  vocabularyIds: string[];
  patternIds: string[];
  grammarIds: string[];
  pronunciationIds: string[];
  exercises: Exercise[];
  takeAway: ExampleSentence;
  cultureNote?: string;
  keyPoints?: string[];
  commonPitfalls?: string[];
  completionChallenge?: string;
}

export interface CultureStory {
  id: string;
  title: string;
  region: string;
  level: Level;
  learningGoals: string[];
  spanishParagraphs: string[];
  translationZh: string[];
  vocabularyIds: string[];
  grammarIds: string[];
  cultureNotes: { title: string; bodyZh: string }[];
  comprehensionExercises: Exercise[];
  outputTask: {
    promptZh: string;
    exampleAnswer: string;
  };
}

export type MemoryStatus = "new" | "learning" | "familiar" | "strong" | "review" | "leech";

export interface MemoryRecord {
  knowledgeItemId: string;
  status: MemoryStatus;
  strength: number;
  stability: number;
  lastReviewedAt?: string;
  nextReviewAt: string;
  correctStreak: number;
  wrongCount: number;
  hintDependency: number;
  errorTypes: Record<string, number>;
  skillScores: Record<string, number>;
}

export interface ExerciseResult {
  exerciseId: string;
  knowledgeItemId: string;
  skill: Skill;
  correct: boolean;
  firstTry: boolean;
  hintCount: number;
  responseTime: number;
  requiresProduction: boolean;
  errorType?: string;
  answeredAt: string;
}

export interface UserPreferences {
  goal: string;
  level: Level;
  dailyMinutes: number;
  accent: "en-US" | "en-GB" | "auto";
  energy: "light" | "steady" | "challenge";
  theme: "light" | "dark" | "system";
  reduceMotion: boolean;
}

export interface ContentBundle {
  vocabulary: VocabularyItem[];
  sentencePatterns: SentencePattern[];
  sceneExpressions: SentencePattern[];
  grammar: GrammarPoint[];
  pronunciation: PronunciationTopic[];
  cultureStories: CultureStory[];
  courses: Lesson[];
}
