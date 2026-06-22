import { readFileSync } from "node:fs";
const read = (name) => JSON.parse(readFileSync(`src/content/generated/${name}`, "utf8"));
const vocabulary = read("vocabulary.json");
const patterns = read("sentence-patterns.json");
const expressions = read("scene-expressions.json");
const grammar = read("grammar.json");
const pronunciation = read("pronunciation.json");
const stories = read("culture-stories.json");
const courses = read("courses.json");
const exercises = courses.flatMap((lesson) => lesson.exercises);
const signature = (item) => `${item.type}|${item.prompt}|${JSON.stringify(item.answer)}`;
const by = (values, key) => Object.fromEntries([...values.reduce((map, item) => map.set(item[key], (map.get(item[key]) ?? 0) + 1), new Map())]);
const semanticRefs = exercises.flatMap((item) => item.knowledgeRefs.filter((ref) => !ref.startsWith("k-")));
const fanout = semanticRefs.reduce((map, ref) => map.set(ref, (map.get(ref) ?? 0) + 1), new Map());
console.log(JSON.stringify({
  vocabulary: {
    total: vocabulary.length,
    active: vocabulary.filter((x) => x.active).length,
    recognition: vocabulary.filter((x) => !x.active).length,
    unique: new Set(vocabulary.map((x) => x.displayForm.toLowerCase())).size,
    withThreeExamples: vocabulary.filter((x) => x.examples.length >= 3).length,
    withThreeCollocations: vocabulary.filter((x) => x.collocations.length >= 3).length,
    levels: by(vocabulary, "level")
  },
  sentencePatterns: { total: patterns.length, unique: new Set(patterns.map((x) => x.pattern.toLowerCase())).size },
  sceneExpressions: { total: expressions.length, unique: new Set(expressions.map((x) => x.pattern.toLowerCase())).size },
  grammar: { total: grammar.length, levels: by(grammar, "level") },
  pronunciation: { total: pronunciation.length, levels: by(pronunciation, "level") },
  stories: { total: stories.length, regions: by(stories, "region"), paragraphs: stories.reduce((sum, item) => sum + item.spanishParagraphs.length, 0), exercises: stories.reduce((sum, item) => sum + item.comprehensionExercises.length, 0) },
  courses: { total: courses.length, exercises: exercises.length, exerciseTypes: by(exercises, "type"), uniqueExerciseSignatures: new Set(exercises.map(signature)).size },
  reviewSafety: { semanticKnowledgeItems: new Set(semanticRefs).size, maxExercisesPerKnowledgeItem: Math.max(...fanout.values()) }
}, null, 2));
