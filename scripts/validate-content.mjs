import { readFileSync } from "node:fs";

const read = (name) => JSON.parse(readFileSync(`src/content/generated/${name}`, "utf8"));
const vocabulary = read("vocabulary.json");
const patterns = read("sentence-patterns.json");
const expressions = read("scene-expressions.json");
const grammar = read("grammar.json");
const pronunciation = read("pronunciation.json");
const stories = read("culture-stories.json");
const courses = read("courses.json");
const summary = read("summary.json");

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const normalized = (value) => String(value).toLocaleLowerCase("en").normalize("NFC").trim();
const canonical = (value) => normalized(value).replace(/[?!.;,:"“”'()]/g, "").replace(/\s+/g, " ").trim();
const exercises = courses.flatMap((lesson) => lesson.exercises);
const levels = new Set(["BASIC", "CET4", "CET6", "IELTS", "TOEFL"]);

check(vocabulary.filter((item) => item.active).length >= 2200, "主动词汇/词块少于2200");
check(vocabulary.filter((item) => !item.active).length >= 550, "理解词汇少于550");
check(patterns.length >= 450, "句型少于450");
check(expressions.length >= 1200, "场景表达少于1200");
check(grammar.length >= 220, "语法点少于220");
check(pronunciation.length >= 90, "发音专题少于90");
check(stories.length >= 100, "文化故事少于100");
check(courses.length === 288, "课程必须为288课");
check(exercises.length === 3456, "课程练习必须为3456题");
check(new Set(exercises.map((item) => item.type)).size === 17, "未覆盖全部17种题型");

check(summary.stats.activeVocabulary === vocabulary.filter((item) => item.active).length, "摘要主动词汇数不一致");
check(summary.stats.recognitionVocabulary === vocabulary.filter((item) => !item.active).length, "摘要理解词汇数不一致");
check(summary.stats.courses === courses.length, "摘要课程数不一致");
check(summary.stats.exercises === exercises.length, "摘要练习数不一致");

check(vocabulary.every((item) => levels.has(item.level)), "存在无效词汇等级");
check(courses.every((item) => levels.has(item.level)), "存在无效课程等级");
check(stories.every((item) => levels.has(item.level)), "存在无效故事等级");
check(new Set(vocabulary.map((item) => normalized(item.displayForm))).size === vocabulary.length, "词汇显示形式重复");
check(!vocabulary.some((item) => /[\u4e00-\u9fff]/.test(item.displayForm)), "英语词汇显示形式中出现中文");
check(vocabulary.every((item) => item.examples?.length >= 3), "存在少于3条例句的词汇");
check(vocabulary.every((item) => item.collocations?.length >= 3), "存在少于3条搭配的词汇");
check(vocabulary.every((item) => new Set(item.examples.map((example) => normalized(example.spanish))).size === item.examples.length), "词汇内部存在重复英语例句");

const allVocabularyExamples = vocabulary.flatMap((item) => item.examples.map((example) => canonical(example.spanish)));
const allVocabularyCollocations = vocabulary.flatMap((item) => item.collocations.map(canonical));
check(new Set(allVocabularyExamples).size === allVocabularyExamples.length, "不同词汇之间存在重复例句");
check(new Set(allVocabularyCollocations).size === allVocabularyCollocations.length, "不同词汇之间存在重复搭配");
check(!vocabulary.some((item) => item.collocations.some((value) => /[\u4e00-\u9fff]/.test(value))), "英语搭配中出现中文");

const vocabularyIds = new Set(vocabulary.map((item) => item.id));
const patternIds = new Set([...patterns, ...expressions].map((item) => item.id));
const grammarIds = new Set(grammar.map((item) => item.id));
const pronunciationIds = new Set(pronunciation.map((item) => item.id));
const validContentRef = (ref) => ref.startsWith("k-") || vocabularyIds.has(ref) || patternIds.has(ref) || grammarIds.has(ref) || pronunciationIds.has(ref);

for (const item of [...patterns, ...expressions]) {
  check(levels.has(item.level), `${item.id} 等级无效`);
  check(item.examples?.length >= 2, `${item.id} 例句不足2条`);
  check(new Set((item.examples ?? []).map((example) => normalized(example.spanish))).size === (item.examples ?? []).length, `${item.id} 内部例句重复`);
  check(item.commonErrors?.[0]?.wrong !== item.commonErrors?.[0]?.fix, `${item.id} 错误示例与修正相同`);
}

for (const item of grammar) {
  check(levels.has(item.level), `${item.id} 等级无效`);
  check(item.examples?.length >= 2, `${item.id} 语法例句不足2条`);
  check(item.commonErrors?.length >= 1, `${item.id} 缺少常见错误`);
  check(item.microExercises?.length >= 4, `${item.id} 微练习不足4个`);
}

for (const item of pronunciation) {
  check(levels.has(item.level), `${item.id} 等级无效`);
  check(item.examples?.length >= 4, `${item.id} 发音例词不足`);
  check(item.selfCheck?.length >= 3, `${item.id} 自检步骤不足`);
}

const exerciseIds = exercises.map((item) => item.id);
check(new Set(exerciseIds).size === exerciseIds.length, "练习ID不唯一");
const semanticRefs = exercises.flatMap((item) => item.knowledgeRefs.filter((ref) => !ref.startsWith("k-")));
check(exercises.every((item) => item.knowledgeRefs.some((ref) => !ref.startsWith("k-"))), "存在没有真实知识点引用的练习");
check(new Set(semanticRefs).size >= 900, "共享知识点数量过少");
const refFanout = new Map();
semanticRefs.forEach((ref) => refFanout.set(ref, (refFanout.get(ref) ?? 0) + 1));
check(Math.max(...refFanout.values()) <= 60, "单个知识点关联练习过多");

for (const lesson of courses) {
  const shortTitle = lesson.title;
  check(lesson.exercises.length === 12, `${lesson.id} 不是12题`);
  check(new Set(lesson.exercises.map((item) => item.type)).size === 12, `${lesson.id} 题型重复`);
  check(Boolean(lesson.realGoal) && lesson.realGoal.includes("场景"), `${lesson.id} 缺少真实学习目标`);
  check(lesson.keyPoints?.length >= 3, `${lesson.id} 缺少核心抓手`);
  check(lesson.commonPitfalls?.length >= 2, `${lesson.id} 缺少常见坑点`);
  check(Boolean(lesson.completionChallenge), `${lesson.id} 缺少完成挑战`);
  check(lesson.dialogue?.length >= 2, `${lesson.id} 迷你对话不足2句`);
  check(lesson.vocabularyIds.length >= 8, `${lesson.id} 词汇引用过少`);
  check(lesson.vocabularyIds.every((id) => vocabularyIds.has(id)), `${lesson.id} 存在无效词汇引用`);
  check(lesson.patternIds.every((id) => patternIds.has(id)), `${lesson.id} 存在无效句型引用`);
  check(lesson.grammarIds.every((id) => grammarIds.has(id)), `${lesson.id} 存在无效语法引用`);
  check(lesson.pronunciationIds.every((id) => pronunciationIds.has(id)), `${lesson.id} 存在无效发音引用`);
  check(lesson.exercises.every((item) => item.prompt.startsWith(`【${shortTitle}】`)), `${lesson.id} 练习提示未绑定本课主题`);
}

for (const exercise of exercises) {
  const answers = Array.isArray(exercise.answer) ? exercise.answer : [exercise.answer];
  if (exercise.options) {
    check(answers.every((answer) => exercise.options.includes(answer)), `${exercise.id} 正确答案不在选项内`);
    check(new Set(exercise.options).size === exercise.options.length, `${exercise.id} 选项重复`);
  }
  if (["listenWord", "listenSentence", "sentenceDictation", "shadowing"].includes(exercise.type)) {
    check(Boolean(exercise.promptAudioText), `${exercise.id} 听力/跟读题缺少音频文本`);
  }
  if (exercise.type === "imageChoice") {
    check(Boolean(exercise.metadata?.visualHint), `${exercise.id} 图片选择题缺少视觉线索`);
    check(Boolean(exercise.visualOptions) && exercise.options?.every((option) => exercise.visualOptions[option]), `${exercise.id} 图片选择题缺少选项视觉信息`);
  }
  check(exercise.feedback.full.includes(Array.isArray(exercise.answer) ? exercise.answer.join("、") : exercise.answer), `${exercise.id} 完整反馈未明确正确答案`);
  check(exercise.knowledgeRefs.every(validContentRef), `${exercise.id} 存在无效知识引用`);
}

const signatures = exercises.map((item) => `${item.type}|${normalized(item.prompt)}|${JSON.stringify(item.answer)}`);
check(new Set(signatures).size === signatures.length, "练习内容存在重复");

for (const story of stories) {
  check(story.spanishParagraphs.length >= 4, `${story.id} 英语正文不足四段`);
  check(story.translationZh.length === story.spanishParagraphs.length, `${story.id} 中英段落数量不一致`);
  check(!story.spanishParagraphs.some((paragraph) => /[\u4e00-\u9fff]/.test(paragraph)), `${story.id} 英语正文含中文`);
  check(story.comprehensionExercises.length >= 4, `${story.id} 缺少互动练习`);
  check(story.vocabularyIds.every((id) => vocabularyIds.has(id)), `${story.id} 存在无效词汇引用`);
  check(story.grammarIds.every((id) => grammarIds.has(id)), `${story.id} 存在无效语法引用`);
}

if (failures.length) {
  console.error(`内容校验失败（${failures.length}项）：`);
  failures.slice(0, 120).forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("内容校验通过", {
  activeVocabulary: vocabulary.filter((item) => item.active).length,
  recognitionVocabulary: vocabulary.filter((item) => !item.active).length,
  patterns: patterns.length,
  expressions: expressions.length,
  grammar: grammar.length,
  pronunciation: pronunciation.length,
  stories: stories.length,
  courses: courses.length,
  exercises: exercises.length,
  semanticKnowledgeItems: new Set(semanticRefs).size,
  maxKnowledgeFanout: Math.max(...refFanout.values())
});
