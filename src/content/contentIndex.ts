import vocabulary from "./generated/vocabulary.json";
import sentencePatterns from "./generated/sentence-patterns.json";
import sceneExpressions from "./generated/scene-expressions.json";
import grammar from "./generated/grammar.json";
import pronunciation from "./generated/pronunciation.json";
import cultureStories from "./generated/culture-stories.json";
import courses from "./generated/courses.json";
import type { ContentBundle, CultureStory, GrammarPoint, Lesson, PronunciationTopic, SentencePattern, VocabularyItem } from "../types/content";
import { normalizeAllCourses, normalizeAllStories } from "./exerciseQuality";

const pronunciationPracticeByFocus: Record<string, Pick<PronunciationTopic, "examples" | "minimalPairs">> = {
  "短元音 /i/ 与长元音 /i:/": {
    examples: ["ship / sheep", "live / leave", "sit / seat", "This ship is cheap."],
    minimalPairs: ["ship / sheep", "live / leave", "sit / seat"]
  },
  "清辅音与浊辅音": {
    examples: ["pin / bin", "fan / van", "coat / goat", "Please bring the blue bag."],
    minimalPairs: ["pin / bin", "fan / van", "coat / goat"]
  },
  "th 发音": {
    examples: ["think / this", "breath / breathe", "three / these", "I think this is the right path."],
    minimalPairs: ["think / this", "breath / breathe", "three / these"]
  },
  "r 与 l": {
    examples: ["right / light", "road / load", "rice / lice", "Turn right at the red light."],
    minimalPairs: ["right / light", "road / load", "rice / lice"]
  },
  "重读音节": {
    examples: ["The record is new.", "Please record the lesson.", "I received a present.", "Please present your idea."],
    minimalPairs: ["REcord / reCORD", "PREsent / preSENT", "PHOtograph / phoTOGraphy"]
  },
  "连读": {
    examples: ["an apple", "turn off", "pick it up", "Turn it off and pick it up."],
    minimalPairs: ["an apple", "turn off", "pick it up"]
  },
  "弱读与功能词": {
    examples: ["to the station", "a cup of tea", "bread and butter", "I want to go to the end of the road."],
    minimalPairs: ["to / weak to", "of / weak of", "and / weak and"]
  },
  "句子语调": {
    examples: ["You're ready.", "Are you ready?", "Really?", "I didn't say he stole it."],
    minimalPairs: ["You're ready. / Are you ready?", "Really. / Really?", "I said it. / I said it?"]
  }
};

const normalizedPronunciation = (pronunciation as PronunciationTopic[]).map((topic) => {
  const practice = pronunciationPracticeByFocus[topic.focus];
  return practice ? { ...topic, ...practice } : topic;
});

const typedVocabulary = vocabulary as VocabularyItem[];
const normalizedCourses = normalizeAllCourses(courses as Lesson[], typedVocabulary);
const normalizedStories = normalizeAllStories(cultureStories as CultureStory[]);

export const content: ContentBundle = {
  vocabulary: typedVocabulary,
  sentencePatterns: sentencePatterns as SentencePattern[],
  sceneExpressions: sceneExpressions as SentencePattern[],
  grammar: grammar as GrammarPoint[],
  pronunciation: normalizedPronunciation,
  cultureStories: normalizedStories,
  courses: normalizedCourses
};

export const contentStats = {
  activeVocabulary: content.vocabulary.filter((item) => item.active).length,
  recognitionVocabulary: content.vocabulary.filter((item) => !item.active).length,
  sentencePatterns: content.sentencePatterns.length,
  sceneExpressions: content.sceneExpressions.length,
  grammar: content.grammar.length,
  pronunciation: content.pronunciation.length,
  cultureStories: content.cultureStories.length,
  courses: content.courses.length,
  exercises: content.courses.reduce((sum, lesson) => sum + lesson.exercises.length, 0)
};
