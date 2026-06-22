import type { CultureStory, Exercise, Lesson, VocabularyItem } from "../types/content";

const hiddenAnswerPromptTypes = new Set<Exercise["type"]>([
  "singleChoice", "multiChoice", "listenWord", "listenSentence", "imageChoice",
  "letterOrder", "wordDictation", "sentenceDictation", "branchDialogue"
]);

const unitLabels: Record<string, [string, string, string]> = {
  greetings: ["👋", "问候交流", "与见面和自我介绍有关"], alphabet: ["🔤", "拼写信息", "与字母、数字和拼写有关"],
  daily: ["🕒", "日常安排", "与作息、频率和习惯有关"], food: ["🍽️", "餐饮场景", "与点餐和饮食偏好有关"],
  city: ["🚉", "城市交通", "与问路、车站和路线有关"], shopping: ["🛍️", "购物服务", "与价格、尺码和退换有关"],
  travel: ["✈️", "旅行住宿", "与机场、酒店和行李有关"], health: ["🩺", "健康求助", "与症状、药品和就医有关"],
  study: ["📚", "学习课堂", "与课程、作业和考试有关"], work: ["💼", "工作沟通", "与邮件、会议和任务有关"],
  media: ["📰", "媒体信息", "与新闻、来源和观点有关"], culture: ["🎭", "文化经历", "与故事、节日和文化差异有关"],
  relationships: ["👥", "人物关系", "与家人、朋友和邀请有关"], home: ["🏠", "住房生活", "与住所、物品和维修有关"],
  money: ["💳", "账单金融", "与账户、付款和预算有关"], technology: ["💻", "数字设备", "与软件、网络和设备有关"],
  environment: ["🌱", "环境议题", "与天气、能源和环保有关"], research: ["📊", "数据研究", "与图表、调查和结论有关"],
  writing: ["✍️", "写作修改", "与段落、论点和修改有关"], presentation: ["🎤", "展示答辩", "与演讲、听众和回答有关"],
  negotiation: ["🤝", "协商讨论", "与建议、分歧和决定有关"], academic: ["🎓", "学术表达", "与概念、因果和长句有关"],
  exam: ["📝", "考试策略", "与题型、推断和答题方法有关"], global: ["🌍", "国际交流", "与合作、影响和解决方案有关"]
};

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffle<T>(values: T[], seed: string): T[] {
  return values.map((value, index) => ({ value, order: hashText(`${seed}-${index}-${String(value)}`) }))
    .sort((a, b) => a.order - b.order).map(({ value }) => value);
}

const answersOf = (exercise: Exercise) => Array.isArray(exercise.answer) ? exercise.answer : [exercise.answer];
const answerText = (exercise: Exercise) => answersOf(exercise).join("、");
const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

function prefixOf(exercise: Exercise, lesson: Lesson) {
  return exercise.prompt.match(/^【[^】]+】/)?.[0] ?? `【${lesson.title}】`;
}

function unitTitle(lesson: Lesson) {
  const value = lesson.exercises.find((item) => typeof item.metadata?.unit === "string")?.metadata?.unit;
  return typeof value === "string" ? value : lesson.title.split("·").at(-1)?.trim() ?? "本课场景";
}

function unitKey(lesson: Lesson, byId: Map<string, VocabularyItem>) {
  return byId.get(lesson.vocabularyIds[0])?.tags[0] ?? "";
}

function distractors(lesson: Lesson, vocabulary: VocabularyItem[], byId: Map<string, VocabularyItem>, excluded: string[], count: number, seed: string) {
  const excludedSet = new Set(excluded.map((value) => value.toLocaleLowerCase("en")));
  const currentUnit = unitKey(lesson, byId);
  const candidates = shuffle(vocabulary.filter((item) => item.active && item.level === lesson.level
    && item.tags[0] !== currentUnit && !excludedSet.has(item.displayForm.toLocaleLowerCase("en"))), seed);
  const result: string[] = [];
  const usedUnits = new Set<string>();
  for (const item of candidates) {
    const key = item.tags[0] ?? "";
    if (usedUnits.has(key)) continue;
    result.push(item.displayForm);
    usedUnits.add(key);
    if (result.length === count) break;
  }
  return result;
}

function visualOptions(options: string[], byForm: Map<string, VocabularyItem>) {
  return Object.fromEntries(options.map((option) => {
    const item = byForm.get(option.toLocaleLowerCase("en"));
    const [emoji, label, descriptionZh] = unitLabels[item?.tags[0] ?? ""] ?? ["🗂️", "综合场景", "根据图形和场景类别判断表达用途"];
    return [option, { emoji, label, descriptionZh }];
  }));
}

function grammarAnalysis(answer: string, prompt: string) {
  const specific: Record<string, string> = {
    could: "句子是在提出礼貌请求，空格位于主语前，需要用情态动词构成疑问结构。",
    would: "空格和后面的 like 构成 would like，用来礼貌表达想要或点单。",
    usually: "空格位于实义动词前，用频率副词说明经常发生的习惯。",
    return: "空格位于情态动词 can 之后，因此需要使用动词原形。",
    flight: "空格位于形容词性物主代词 my 之后，并在句中充当主语中心词，因此需要名词。",
    have: "主语是 I，句子要表达身体状况或拥有，因此使用一般现在时动词原形。",
    need: "主语是 I，空格承担谓语功能，表达需要时使用一般现在时动词原形。"
  };
  return specific[answer.toLocaleLowerCase("en")] ?? `空格必须同时符合句子“${prompt.replace(/^【[^】]+】/, "").replace(/（填入缺失内容）$/, "").trim()}”的语义和前后搭配。`;
}

function orderAnalysis(answer: string) {
  const first = answer.trim().split(/\s+/)[0] ?? "句首成分";
  return /^(could|can|would|do|does|did|is|are|was|were|have|has)$/i.test(first)
    ? `这是疑问句，先放句首助动词或情态动词“${first}”，再接主语、谓语和其余信息。`
    : `这是陈述句，先确定主语“${first}”，再依次安排谓语、宾语或补充信息。`;
}

function courseFeedback(exercise: Exercise, lesson: Lesson): Exercise["feedback"] {
  const unit = unitTitle(lesson);
  const answer = answerText(exercise);
  const firstAnswer = answersOf(exercise)[0] ?? "";
  switch (exercise.type) {
    case "singleChoice":
    case "listenWord":
      return {
        light: "先完整播放一遍，只判断音节数量和重音位置，不要急着看选项猜答案。",
        rule: "第二遍逐项对照开头音、核心元音和词尾，排除与录音音形不一致的选项。",
        full: `本题分析：录音中的音节、重音和词尾与“${answer}”一致，其他选项至少有一处关键发音不同。因此，正确答案是“${answer}”。`
      };
    case "multiChoice":
      return {
        light: `先回忆“${unit}”这一课处理的真实场景，再按表达用途给选项分类。`,
        rule: "本题要求选择两项；先排除明显属于其他场景的表达，再核对剩余选项。",
        full: `本题分析：题目考查“${unit}”场景词汇。“${answer}”都来自本课核心表达，其余选项属于其他场景。因此，应选择“${answer}”。`
      };
    case "listenSentence":
      return {
        light: "第一遍先听句子主干和语气，不要被个别熟悉单词带偏。",
        rule: "第二遍重点核对主语、核心动词、否定词以及时间或地点信息。",
        full: `本题分析：录音的句子主干和细节共同对应“${answer}”；其他选项改变了动作、对象或时间信息。因此，正确答案是“${answer}”。`
      };
    case "imageChoice":
      return {
        light: `先看每张卡片的图形和中文场景说明，再判断哪一项属于“${unit}”。`,
        rule: "不要只看单词是否眼熟，要把表达的实际使用场景与本课主题对应起来。",
        full: `本题分析：“${answer}”对应的卡片属于“${unit}”场景，其他卡片代表不同主题。因此，正确答案是“${answer}”。`
      };
    case "letterOrder":
      return {
        light: "先播放音频，判断单词有几个明显音节，再观察可用字母数量。",
        rule: "按发音顺序安排字母，重点检查开头、元音组合和词尾。",
        full: `本题分析：录音中的发音顺序对应字母组合“${answer}”，共有 ${firstAnswer.replace(/\s+/g, "").length} 个字母。因此，正确拼写是“${answer}”。`
      };
    case "wordDictation":
      return {
        light: "第一遍先听整体发音和重音，第二遍再拆分音节记录字母。",
        rule: "写完后对照录音检查元音组合、双写字母和词尾。",
        full: `本题分析：录音中的发音可以按音节逐段对应到“${answer}”，重音与词尾也相符。因此，正确拼写是“${answer}”。`
      };
    case "sentenceDictation":
      return {
        light: "第一遍先记主语、核心动词和句子大意，暂时不要追求逐词写全。",
        rule: "第二遍补充冠词、介词、助动词和词尾，最后检查大小写与标点。",
        full: `本题分析：录音的主干、功能词和细节组合成完整句子“${answer}”。应先抓内容词，再补语法词。因此，完整答案是“${answer}”。`
      };
    case "fillBlank":
      return {
        light: "先判断空格在句中承担什么成分，再结合整句意思缩小范围。",
        rule: "检查空格前后的固定搭配、主谓关系和词形要求，不能只凭中文直译。",
        full: `本题分析：${grammarAnalysis(firstAnswer, exercise.prompt)} 因此，空格应填“${answer}”。`
      };
    case "sentenceBuild":
      return {
        light: "先找主语和核心谓语，再处理宾语、地点、时间等补充信息。",
        rule: "判断句子是陈述句还是疑问句；疑问句通常把助动词或情态动词放在主语前。",
        full: `本题分析：${orderAnalysis(firstAnswer)} 因此，正确语序是“${answer}”。`
      };
    case "conjugation":
      return {
        light: "先确定时态，再看主语的人称和单复数。",
        rule: "句子描述日常习惯，主语 she 是第三人称单数，实义动词需要相应变化。",
        full: `本题分析：every day 表明句子使用一般现在时；主语 she 是第三人称单数，所以 practice 要变为“${answer}”。因此，空格应填“${answer}”。`
      };
    case "errorCorrection":
      return {
        light: "先找主语和谓语，检查两者在人称和时态上是否一致。",
        rule: "句子描述日常行为，主语 she 是第三人称单数，重点检查实义动词形式。",
        full: `本题分析：原句主语 she 与动词 go 不一致；一般现在时第三人称单数需要使用 goes。因此，完整正确句子是“${answer}”。`
      };
    case "accentRepair":
      return {
        light: "先判断句首形式是两个词还是缩写，再检查缺少的英文标点。",
        rule: "I am 缩写时会省略字母，并用 apostrophe 标记省略位置。",
        full: `本题分析：Im 缺少表示省略的 apostrophe；I am 的正确缩写是 I'm。因此，完整正确句子是“${answer}”。`
      };
    case "shadowing":
      return {
        light: "先听整句节奏，再分意群模仿，不要逐词停顿。",
        rule: "回听时重点检查重读词、弱读词、停顿位置和句尾语调。",
        full: `本题分析：本题不是默写，而是模仿“${answer}”的节奏与可懂度。先保证关键词清楚，再逐步接近自然语速。`
      };
    case "branchDialogue":
      return {
        light: "先判断对方这句话是在提问、请求、确认还是表达态度。",
        rule: "合适回应必须直接回应对方、语义连贯，并符合真实交流语气。",
        full: `本题分析：对方是在请求重复内容，回应需要先表示配合，再说明会放慢速度。“${answer}”同时满足语义和礼貌要求，因此是正确答案。`
      };
    case "freeInput":
      return {
        light: `先确定你要在“${unit}”场景中完成的沟通目标，再写最短的完整句。`,
        rule: "先保证主语和谓语完整，再补充一个真实细节；不要求逐字复现参考句。",
        full: `本题分析：这是开放表达题，重点是完成“${unit}”场景中的沟通目标。参考表达“${answer}”展示了一种完整说法，你的答案可以不同，只要意思清楚、结构完整。`
      };
    case "storyRetell":
      return {
        light: "先用一句话说清场景，再补充发生了什么，不必复述所有细节。",
        rule: "复述至少要包含场景、关键行动和结果，并用自己的句子连接信息。",
        full: `本题分析：复述的重点是信息结构，而不是逐字背诵。参考表达“${answer}”包含场景和处理结果，可据此检查自己的内容是否完整。`
      };
    default:
      return {
        light: "先明确题目考查听音、语义、语法还是表达，再处理具体选项。",
        rule: "回到题干中的限制条件，逐项排除不符合语境或结构的答案。",
        full: `本题分析：结合题干条件与本课语境，可以确定“${answer}”满足要求。因此，正确答案是“${answer}”。`
      };
  }
}

function coursePrompt(exercise: Exercise, lesson: Lesson) {
  const prefix = prefixOf(exercise, lesson);
  const unit = unitTitle(lesson);
  const body = exercise.prompt.slice(prefix.length).trim();
  switch (exercise.type) {
    case "singleChoice":
    case "listenWord": return `${prefix}播放音频，选择你听到的英语单词或短语。`;
    case "multiChoice": return `${prefix}根据本课“${unit}”的词汇内容，选择两项属于本课的重点表达（选 2 项）。`;
    case "listenSentence": return `${prefix}播放音频，选择与录音内容完全一致的完整句子。`;
    case "imageChoice": return `${prefix}观察卡片中的图形和中文场景线索，选择属于“${unit}”场景的英语表达。`;
    case "letterOrder": return `${prefix}播放音频，然后按正确顺序拼出你听到的单词。`;
    case "wordDictation": return `${prefix}播放音频，写出你听到的英语单词或短语。`;
    case "sentenceDictation": return `${prefix}播放音频，写出完整句子；注意大小写和标点。`;
    case "fillBlank": return `${prefix}根据句意和语法补全空格，只填写缺失的英文内容：${body.replace(/（填入缺失内容）$/, "")}`;
    case "sentenceBuild": return `${prefix}将下方词语按英语语序排列成一个完整句子。`;
    case "conjugation": return `${prefix}根据一般现在时规则，用括号中动词的正确形式补全句子：She ___ English every day.（practice）`;
    case "errorCorrection": return `${prefix}找出并改正句中的动词形式错误，写出完整正确句子：She go to English class every day.`;
    case "accentRepair": return `${prefix}补上缺失的 apostrophe（撇号），写出完整正确句子：Im ready to answer.`;
    case "branchDialogue": return `${prefix}播放对方的话，选择语义自然、礼貌且能直接回应对方的选项。`;
    case "freeInput": return body.includes("请结合自己情况") ? `${prefix}${body.replace("请结合自己情况", "请根据自己的真实情况")}` : exercise.prompt;
    default: return exercise.prompt;
  }
}

function normalizeCourseExercise(
  exercise: Exercise,
  lesson: Lesson,
  vocabulary: VocabularyItem[],
  byId: Map<string, VocabularyItem>,
  byForm: Map<string, VocabularyItem>
): Exercise {
  const answers = answersOf(exercise);
  let options = exercise.options ? [...exercise.options] : undefined;

  if (["singleChoice", "listenWord", "imageChoice"].includes(exercise.type)) {
    const extra = distractors(lesson, vocabulary, byId, answers, 3, exercise.id + "-d");
    options = shuffle(unique([...answers, ...extra]), exercise.id + "-o");
  } else if (exercise.type === "multiChoice") {
    const extra = distractors(lesson, vocabulary, byId, answers, 3, exercise.id + "-d");
    options = shuffle(unique([...answers, ...extra]), exercise.id + "-o");
  } else if (options) {
    options = shuffle(options, exercise.id + "-o");
  }

  const next: Exercise = {
    ...exercise,
    prompt: coursePrompt(exercise, lesson),
    promptAudioText: exercise.type === "letterOrder" ? String(exercise.answer) : exercise.promptAudioText,
    options,
    feedback: courseFeedback(exercise, lesson)
  };
  if (exercise.type === "imageChoice" && options) {
    next.visualOptions = visualOptions(options, byForm);
  }
  return next;
}

function storyFeedback(exercise: Exercise, story: CultureStory): Exercise["feedback"] {
  const answer = answerText(exercise);
  if (exercise.type === "storyRetell") {
    return {
      light: "先定位故事发生的场景，再找人物采取的关键行动。",
      rule: "复述时按“场景—行动—结果”的顺序组织两到三句，不需要逐字背原文。",
      full: `本题分析：题目要求复述“${story.title}”的核心经过，重点应包含场景、人物行动和结果。参考表达是“${answer}”，可用来检查信息是否完整。`
    };
  }
  if (exercise.type === "multiChoice") {
    return {
      light: "回到故事中描述沟通成功原因的句子，分别寻找语言选择和说话态度。",
      rule: "本题需要选择两项；只保留原文明确支持的做法。",
      full: `本题分析：故事明确把简洁表达和尊重态度列为沟通顺利的原因，因此应选择“${answer}”。`
    };
  }
  return {
    light: "先在原文中找到与题干关键词对应的句子，再判断人物具体做了什么。",
    rule: "区分原文事实和自己的推测；正确选项必须有故事中的明确描述支持。",
    full: `本题分析：根据“${story.title}”中的对应句子，题干所问信息指向“${answer}”。${exercise.feedback.rule} 因此，正确答案是“${answer}”。`
  };
}

function normalizeAllCourses(courses: Lesson[], vocabulary: VocabularyItem[]): Lesson[] {
  const byId = new Map(vocabulary.map((item) => [item.id, item]));
  const byForm = new Map<string, VocabularyItem>();
  for (const item of vocabulary) byForm.set(item.displayForm.toLocaleLowerCase("en"), item);
  return courses.map((lesson) => ({
    ...lesson,
    exercises: lesson.exercises.map((exercise) => normalizeCourseExercise(exercise, lesson, vocabulary, byId, byForm))
  }));
}

function normalizeAllStories(stories: CultureStory[]): CultureStory[] {
  return stories.map((story) => ({
    ...story,
    comprehensionExercises: story.comprehensionExercises.map((exercise) => ({
      ...exercise,
      options: exercise.options ? shuffle(exercise.options, exercise.id + "-o") : undefined,
      feedback: storyFeedback(exercise, story)
    }))
  }));
}

export { normalizeAllCourses, normalizeAllStories };

export function shouldHideAnswerInPrompt(exercise: Exercise) {
  return hiddenAnswerPromptTypes.has(exercise.type);
}
