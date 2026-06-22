import { mkdirSync, writeFileSync } from "node:fs";

const outDir = "src/content/generated";
mkdirSync(outDir, { recursive: true });

const LEVELS = [
  { id: "BASIC", label: "基础", short: "basic", descriptor: "starter", minutes: 10, cycles: ["基础能力起步", "基础能力巩固"] },
  { id: "CET4", label: "四级", short: "CET-4", descriptor: "cet four", minutes: 14, cycles: ["四级词汇语法", "四级听读专项", "四级写译冲刺"] },
  { id: "CET6", label: "六级", short: "CET-6", descriptor: "cet six", minutes: 16, cycles: ["六级核心升级", "六级长篇与听力", "六级写译输出"] },
  { id: "IELTS", label: "雅思", short: "IELTS", descriptor: "ielts", minutes: 18, cycles: ["雅思听读写说基础", "雅思任务突破"] },
  { id: "TOEFL", label: "托福", short: "TOEFL", descriptor: "toefl", minutes: 18, cycles: ["托福校园学术基础", "托福综合输出"] }
];

const UNITS = [
  ["greetings", "问候与自我介绍", "first meeting", "能自然问候、介绍自己并回应对方", ["hello", "name", "student", "teacher", "classroom", "partner", "spelling", "country"], "Hello, I am learning English."],
  ["alphabet", "字母、数字与拼写", "spelling and numbers", "能听懂字母、数字、编号和基础拼写", ["letter", "number", "email", "code", "phone", "address", "capital letter", "lowercase"], "Could you spell your name, please?"],
  ["daily", "日常作息与频率", "daily routine", "能描述日程、频率和个人习惯", ["routine", "morning", "evening", "usually", "sometimes", "habit", "schedule", "weekend"], "I usually review English in the morning."],
  ["food", "饮食、点餐与偏好", "ordering food", "能点餐、表达偏好并处理过敏信息", ["menu", "water", "coffee", "allergy", "bill", "portion", "flavor", "reservation"], "I would like a coffee without sugar."],
  ["city", "城市方向与交通", "city travel", "能问路、理解路线并说明交通选择", ["station", "platform", "ticket", "map", "corner", "crossing", "direction", "transfer"], "Could you tell me where the station is?"],
  ["shopping", "购物、价格与退换", "shopping", "能询问价格、尺码、折扣和退换条件", ["price", "size", "receipt", "discount", "cash", "card", "fitting room", "refund"], "Can I return it with this receipt?"],
  ["travel", "住宿、机场与旅行", "travel planning", "能处理酒店、机场、行李和延误问题", ["hotel", "flight", "passport", "luggage", "delay", "gate", "booking", "check-in"], "My flight is delayed, but I have a connection."],
  ["health", "健康、药店与求助", "health and help", "能说明症状、询问药品并表达紧急情况", ["headache", "fever", "pharmacy", "medicine", "appointment", "emergency", "insurance", "symptom"], "I have a headache and need some medicine."],
  ["study", "学习、考试与课堂", "study and tests", "能描述学习计划、课堂任务和考试反馈", ["homework", "exam", "notebook", "feedback", "deadline", "question", "answer", "progress"], "I need feedback on my English writing."],
  ["work", "工作、邮件与会议", "work communication", "能写邮件、开会、确认任务和更新进度", ["meeting", "email", "attachment", "deadline", "project", "colleague", "report", "proposal"], "I have attached the report to the email."],
  ["media", "媒体、信息与观点", "media and opinions", "能概括新闻、表达观点并识别信息来源", ["headline", "source", "article", "podcast", "opinion", "evidence", "claim", "summary"], "The article gives evidence for its main claim."],
  ["culture", "文化、故事与经历", "culture and stories", "能讲述经历、比较文化并保持表达礼貌", ["culture", "festival", "memory", "tradition", "story", "region", "custom", "experience"], "This tradition is different from what I expected."],
  ["relationships", "家庭、朋友与关系", "relationships", "能介绍关系、描述性格并处理邀请", ["family", "friendship", "invitation", "neighbor", "personality", "support", "promise", "plan"], "My friends invited me to a small dinner."],
  ["home", "住房、物品与维修", "home and repairs", "能描述住所、物品位置和维修需求", ["apartment", "kitchen", "window", "key", "repair", "rent", "noise", "neighbor"], "The window does not close properly."],
  ["money", "银行、账单与预算", "money and services", "能理解账单、预算、账户和付款问题", ["account", "budget", "bill", "payment", "fee", "receipt", "transfer", "balance"], "I need to check the payment on my account."],
  ["technology", "手机、软件与网络", "technology", "能说明设备、应用、密码和网络问题", ["app", "password", "screen", "update", "file", "network", "device", "settings"], "The app asks me to update my password."],
  ["environment", "天气、环境与公共议题", "environment", "能讨论天气、环保习惯和公共问题", ["weather", "climate", "recycling", "energy", "pollution", "transport", "community", "policy"], "Public transport can reduce pollution."],
  ["research", "阅读、数据与研究", "research reading", "能读懂图表、研究摘要和数据结论", ["data", "chart", "survey", "trend", "method", "result", "sample", "analysis"], "The chart shows a clear trend over time."],
  ["writing", "写作、修改与表达", "writing", "能写段落、改写句子并组织论点", ["paragraph", "topic sentence", "example", "transition", "revision", "draft", "argument", "conclusion"], "A clear topic sentence helps the reader."],
  ["presentation", "演讲、讨论与答辩", "presentation", "能展示观点、回答问题并控制语气", ["presentation", "slide", "audience", "question", "response", "confidence", "outline", "key point"], "Let me answer that question in two parts."],
  ["negotiation", "协商、建议与分歧", "negotiation", "能提出建议、部分同意并礼貌表达分歧", ["suggestion", "agreement", "concern", "option", "compromise", "boundary", "priority", "decision"], "I agree with the goal, but I have one concern."],
  ["academic", "学术英语与长难句", "academic English", "能分析长句、定义概念并解释因果", ["concept", "definition", "cause", "effect", "contrast", "context", "implication", "assumption"], "The result depends on the context of the study."],
  ["exam", "四六级题型与策略", "exam strategy", "能完成听力、阅读、翻译、写作和完形任务", ["listening section", "reading passage", "translation", "composition", "keyword", "inference", "scan", "paraphrase"], "Scan the passage before choosing the answer."],
  ["global", "国际交流与综合表达", "global communication", "能在跨文化、学习和工作场景中综合表达", ["global issue", "collaboration", "perspective", "responsibility", "innovation", "impact", "solution", "reflection"], "We need a practical solution with long-term impact."]
].map(([key, title, sceneEn, goal, terms, takeAway]) => ({ key, title, sceneEn, goal, terms, takeAway }));

const patternSeeds = [
  "I would like to [verb] [object].",
  "Could you clarify [detail]?",
  "The main point is that [idea].",
  "I agree with [point], but [concern].",
  "It depends on [context].",
  "Compared with [option], [choice] is more practical.",
  "The reason is that [cause].",
  "This example shows [result].",
  "I am not sure whether [statement].",
  "Let me explain [topic] step by step.",
  "What I mean is [clarification].",
  "From my point of view, [opinion].",
  "The data suggests that [trend].",
  "If [condition], we can [action].",
  "Although [contrast], [main idea].",
  "I used to [habit], but now I [change].",
  "I have been [activity] for [time].",
  "By the time [event], [result].",
  "This issue is related to [factor].",
  "One possible solution is to [action].",
  "Could we move [item] to [time]?",
  "I need a moment to [action].",
  "The problem is not [wrong focus], but [real focus].",
  "Please let me know if [condition].",
  "I am looking for [specific item].",
  "There seems to be [problem].",
  "I appreciate [help], especially [detail].",
  "The article argues that [claim].",
  "This can be interpreted as [meaning].",
  "The author distinguishes between [a] and [b].",
  "In practical terms, [idea].",
  "The evidence is not strong enough to [conclusion].",
  "I would rather [choice] than [alternative].",
  "What matters most is [priority].",
  "The more [cause], the more [effect].",
  "This is consistent with [evidence].",
  "I need to revise [text] before [deadline].",
  "Let us focus on [scope].",
  "The question asks us to infer [meaning].",
  "In summary, [conclusion]."
];

const grammarSeeds = [
  ["be 动词与身份", "am/is/are + noun/adjective", "表达身份、状态和基本描述"],
  ["一般现在时", "subject + base verb / -s", "描述习惯、事实和日常安排"],
  ["一般过去时", "verb-ed / irregular past", "讲述已经完成的动作"],
  ["现在完成时", "have/has + past participle", "连接过去经历和现在结果"],
  ["现在进行时", "am/is/are + -ing", "描述正在发生或临时安排"],
  ["情态动词 can/could", "can/could + base verb", "表达能力、请求和可能性"],
  ["可数与不可数名词", "a/an/some/much/many", "表达数量和类别"],
  ["冠词 a/an/the", "article + noun", "区分首次提到和特指信息"],
  ["比较级与最高级", "comparative/superlative", "比较选择、程度和优势"],
  ["条件句", "if + condition, result", "表达条件、结果和建议"],
  ["被动语态", "be + past participle", "突出动作承受者或流程"],
  ["定语从句", "who/that/which + clause", "补充说明人物、事物和观点"],
  ["名词性从句", "that/what/whether + clause", "表达观点、问题和信息"],
  ["非谓语结构", "to do / doing / done", "压缩信息并连接动作"],
  ["连接词", "because/although/however/therefore", "组织逻辑关系"],
  ["间接引语", "said/told/asked + clause", "转述他人信息"],
  ["虚拟语气", "would/could/if I were", "表达假设、建议和礼貌"],
  ["强调与倒装", "not only / only when / so...that", "突出重点和正式语气"],
  ["长难句拆解", "main clause + modifiers", "识别主干、插入和修饰"],
  ["学术定义句", "X refers to / is defined as", "给概念下定义并限定范围"]
];

const pronunciationSeeds = [
  {
    title: "短元音 /i/ 与长元音 /i:/",
    explanation: "区分 ship/sheep、live/leave",
    examples: ["ship / sheep", "live / leave", "sit / seat", "This ship is cheap."],
    minimalPairs: ["ship / sheep", "live / leave", "sit / seat"]
  },
  {
    title: "清辅音与浊辅音",
    explanation: "区分 pin/bin、fan/van",
    examples: ["pin / bin", "fan / van", "coat / goat", "Please bring the blue bag."],
    minimalPairs: ["pin / bin", "fan / van", "coat / goat"]
  },
  {
    title: "th 发音",
    explanation: "练习 think/this/breath/breathe",
    examples: ["think / this", "breath / breathe", "three / these", "I think this is the right path."],
    minimalPairs: ["think / this", "breath / breathe", "three / these"]
  },
  {
    title: "r 与 l",
    explanation: "区分 right/light、road/load",
    examples: ["right / light", "road / load", "rice / lice", "Turn right at the red light."],
    minimalPairs: ["right / light", "road / load", "rice / lice"]
  },
  {
    title: "重读音节",
    explanation: "识别 record、present 等词的重音变化",
    examples: ["The record is new.", "Please record the lesson.", "I received a present.", "Please present your idea."],
    minimalPairs: ["REcord / reCORD", "PREsent / preSENT", "PHOtograph / phoTOGraphy"]
  },
  {
    title: "连读",
    explanation: "练习 an apple、turn off、pick it up",
    examples: ["an apple", "turn off", "pick it up", "Turn it off and pick it up."],
    minimalPairs: ["an apple", "turn off", "pick it up"]
  },
  {
    title: "弱读与功能词",
    explanation: "让 to、of、and 在句中自然弱读",
    examples: ["to the station", "a cup of tea", "bread and butter", "I want to go to the end of the road."],
    minimalPairs: ["to / weak to", "of / weak of", "and / weak and"]
  },
  {
    title: "句子语调",
    explanation: "区分陈述句、一般疑问句和强调语气",
    examples: ["You're ready.", "Are you ready?", "Really?", "I didn't say he stole it."],
    minimalPairs: ["You're ready. / Are you ready?", "Really. / Really?", "I said it. / I said it?"]
  }
];

const exerciseTypes = [
  "singleChoice", "multiChoice", "listenWord", "imageChoice", "listenSentence", "letterOrder",
  "sentenceDictation", "wordDictation", "shadowing", "fillBlank", "branchDialogue", "storyRetell",
  "singleChoice", "sentenceBuild", "listenWord", "conjugation", "listenSentence", "errorCorrection",
  "sentenceDictation", "accentRepair", "shadowing", "freeInput", "branchDialogue", "storyRetell"
];

const pad = (value, width) => String(value).padStart(width, "0");
const clean = (value) => String(value).replace(/\s+/g, " ").trim();
const noPunct = (value) => clean(value).replace(/[?!.;,:"“”]/g, "");
const cap = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const unique = (values) => Array.from(new Set(values.filter(Boolean)));
const usedDisplayForms = new Set();

const conceptOverrides = {
  hello: "greeting",
  "check-in": "check-in process",
  scan: "scanning strategy"
};

function concept(base) {
  return conceptOverrides[base] ?? base;
}

const activeTemplates = [
  (base) => base,
  (base) => `ask about the ${concept(base)}`,
  (base) => `describe the ${concept(base)}`,
  (base) => `explain the ${concept(base)}`,
  (base) => `analyze the ${concept(base)}`,
  (base) => `update the ${concept(base)}`,
  (base) => `reflect on the ${concept(base)}`
];

const recognitionTemplates = [
  (base) => `recognize the ${concept(base)}`,
  (base) => `identify the ${concept(base)}`,
  (base) => `notice the ${concept(base)}`,
  (base) => `summarize the ${concept(base)}`,
  (base) => `evaluate the ${concept(base)}`,
  (base) => `prioritize the ${concept(base)}`,
  (base) => `interpret the ${concept(base)}`
];

const levelIds = new Set(LEVELS.map((level) => level.id));
const lessonKeyFor = (unit, level, cycleIndex) => `${unit.key}-${level.id}-${cycleIndex + 1}`;
const cycleSlug = (level, cycleIndex) => `${level.id.toLowerCase()} module ${cycleIndex + 1}`;

function uniqueDisplayForm(candidate, unit, itemIndex = 0) {
  const base = clean(candidate).toLowerCase();
  const fallbacks = [
    base,
    `${unit.sceneEn} ${base}`,
    `${unit.key} ${base}`,
    `${base} ${itemIndex + 1}`
  ];
  for (const form of fallbacks) {
    const key = form.toLowerCase();
    if (!usedDisplayForms.has(key)) {
      usedDisplayForms.add(key);
      return form;
    }
  }
  let suffix = 2;
  while (usedDisplayForms.has(`${base} ${suffix}`)) suffix += 1;
  const form = `${base} ${suffix}`;
  usedDisplayForms.add(form);
  return form;
}

function writeJson(name, data) {
  writeFileSync(`${outDir}/${name}`, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function syllables(value) {
  const first = String(value).split(/\s+/)[0] ?? value;
  const chunks = first.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]+(?=[aeiouy]|$))?/gi);
  return chunks?.length ? chunks.map((item) => item.toLowerCase()) : [first.toLowerCase()];
}

function example(english, zh) {
  return { spanish: clean(english), zh };
}

function makeOptions(answer, pool, count = 4) {
  return unique([answer, ...pool.filter((item) => item !== answer)]).slice(0, count);
}

function rotateOptions(values, seed) {
  if (!values?.length) return values;
  const offset = Array.from(seed).reduce((sum, character) => sum + character.charCodeAt(0), 0) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function visualOptionsFor(options) {
  const cues = ["🗣️", "🔤", "📅", "☕", "🚇", "🛒", "✈️", "💊", "📚", "💼", "📰", "🌍"];
  return Object.fromEntries(options.map((option, index) => [option, {
    emoji: cues[index % cues.length],
    label: option.split(/\s+/).slice(0, 2).join(" "),
    descriptionZh: `与“${option}”相关的英语场景线索`
  }]));
}

const vocabulary = [];
const activeByLesson = new Map();
let vocabularyIndex = 1;

for (let unitIndex = 0; unitIndex < UNITS.length; unitIndex += 1) {
  const unit = UNITS[unitIndex];
  for (let levelIndex = 0; levelIndex < LEVELS.length; levelIndex += 1) {
    const level = LEVELS[levelIndex];
    for (let cycleIndex = 0; cycleIndex < level.cycles.length; cycleIndex += 1) {
      const lessonKey = lessonKeyFor(unit, level, cycleIndex);
      const lessonWords = [];
      for (let itemIndex = 0; itemIndex < 8; itemIndex += 1) {
        const base = unit.terms[itemIndex % unit.terms.length];
        const candidate = itemIndex === 0 && unitIndex === 0 && levelIndex === 0 && cycleIndex === 0
          ? "hello"
          : level.id === "BASIC" && cycleIndex === 0
            ? activeTemplates[levelIndex](base)
            : `${activeTemplates[levelIndex](base)} for ${cycleSlug(level, cycleIndex)}`;
        const form = uniqueDisplayForm(candidate, unit, itemIndex);
        const id = `v-${pad(vocabularyIndex, 4)}`;
        lessonWords.push(id);
        vocabulary.push({
          id,
          lemma: form,
          displayForm: form,
          partOfSpeech: itemIndex % 3 === 0 ? "phrase" : itemIndex % 3 === 1 ? "noun" : "verb phrase",
          level: level.id,
          active: true,
          meaningsZh: [`${level.label}${unit.title}场景中的核心表达：${form}`],
          syllables: syllables(form),
          stressedSyllable: 0,
          audioText: form,
          accentVariants: [
            { region: "en-US", audioText: form, note: "美式英语发音参考。" },
            { region: "en-GB", audioText: form, note: "英式英语发音参考。" }
          ],
          examples: [
            example(`I can use "${form}" in a ${unit.sceneEn} situation.`, `我能在“${unit.title}”场景中使用“${form}”。`),
            example(`Please listen for "${form}" before you answer.`, `作答前请听出“${form}”。`),
            example(`The phrase "${form}" helps me complete a ${level.short} task.`, `“${form}”能帮助我完成${level.label}任务。`)
          ],
          collocations: unique([`clear ${form}`, `${form} practice`, `${form} checklist`, `${form} example`]),
          tags: [unit.key, level.id, level.cycles[cycleIndex]]
        });
        vocabularyIndex += 1;
      }
      activeByLesson.set(lessonKey, lessonWords);
    }
  }
}

for (let unitIndex = 0; unitIndex < UNITS.length; unitIndex += 1) {
  const unit = UNITS[unitIndex];
  for (let levelIndex = 0; levelIndex < LEVELS.length; levelIndex += 1) {
    const level = LEVELS[levelIndex];
    for (let cycleIndex = 0; cycleIndex < level.cycles.length; cycleIndex += 1) {
      for (let itemIndex = 0; itemIndex < 2; itemIndex += 1) {
        const base = unit.terms[(itemIndex + 5) % unit.terms.length];
        const form = uniqueDisplayForm(`${recognitionTemplates[levelIndex](base)} for ${cycleSlug(level, cycleIndex)}`, unit, itemIndex);
        vocabulary.push({
          id: `rv-${pad(vocabularyIndex, 4)}`,
          lemma: form,
          displayForm: form,
          partOfSpeech: "recognition phrase",
          level: level.id,
          active: false,
          meaningsZh: [`阅读和听力中需要识别的扩展表达：${form}`],
          syllables: syllables(form),
          stressedSyllable: 0,
          audioText: form,
          accentVariants: [
            { region: "en-US", audioText: form, note: "美式英语发音参考。" },
            { region: "en-GB", audioText: form, note: "英式英语发音参考。" }
          ],
          examples: [
            example(`The text uses "${form}" to add detail.`, `文本用“${form}”补充细节。`),
            example(`I only need to recognize "${form}" at this stage.`, `当前阶段只需识别“${form}”。`),
            example(`Underline "${form}" when it appears in the passage.`, `在文章中出现“${form}”时把它标出来。`)
          ],
          collocations: unique([`recognize ${form}`, `${form} in context`, `${form} note`]),
          tags: [unit.key, level.id, level.cycles[cycleIndex], "recognition"]
        });
        vocabularyIndex += 1;
      }
    }
  }
}

const sentencePatterns = [];
let patternIndex = 1;
for (const level of LEVELS) {
  for (let cycleIndex = 0; cycleIndex < level.cycles.length; cycleIndex += 1) {
    for (const seed of patternSeeds) {
      const pattern = `${seed} (${level.short} · ${level.cycles[cycleIndex]})`;
      sentencePatterns.push({
        id: `p-${pad(patternIndex, 4)}`,
        pattern,
        meaningZh: `${level.label}${level.cycles[cycleIndex]}可复用句型：${seed}`,
        usageNote: "先替换方括号中的信息，再根据真实场景调整语气。",
        register: patternIndex % 5 === 0 ? "formal" : patternIndex % 4 === 0 ? "informal" : "neutral",
        level: level.id,
        slots: [
          { name: "verb", options: ["explain", "confirm", "compare", "revise"] },
          { name: "object", options: ["the plan", "the answer", "the detail", "the result"] }
        ],
        examples: [
          example(`I can explain the plan in a ${level.descriptor} way.`, `我能用${level.label}水平说明计划。`),
          example(`Could you clarify the key detail for this ${level.cycles[cycleIndex]} task?`, `你能说明这个“${level.cycles[cycleIndex]}”任务的关键细节吗？`)
        ],
        commonErrors: [
          { wrong: "I can to explain it.", fix: "I can explain it.", reasonZh: "情态动词后使用动词原形。" }
        ],
        tags: [level.id, level.cycles[cycleIndex], "pattern"]
      });
      patternIndex += 1;
    }
  }
}

const sceneExpressions = [];
let expressionIndex = 1;
for (const unit of UNITS) {
  for (let itemIndex = 0; itemIndex < 60; itemIndex += 1) {
    const level = LEVELS[itemIndex % LEVELS.length];
    const term = unit.terms[itemIndex % unit.terms.length];
    const expression = itemIndex % 3 === 0
      ? `Could you help me with the ${term}?`
      : itemIndex % 3 === 1
        ? `I need to confirm the ${term}.`
        : `The ${term} is important in this situation.`;
    sceneExpressions.push({
      id: `s-${pad(expressionIndex, 4)}`,
      pattern: `${expression} [${unit.key}-${itemIndex + 1}]`,
      meaningZh: `“${unit.title}”场景表达：${expression}`,
      usageNote: "适合在真实对话、听力理解或翻译任务中使用。",
      register: itemIndex % 6 === 0 ? "formal" : "neutral",
      level: level.id,
      slots: [{ name: "term", options: unit.terms }],
      examples: [
        example(expression, `可表达“需要处理${term}”。`),
        example(`Please write down the ${term} before we continue.`, `继续之前请记录${term}。`)
      ],
      commonErrors: [
        { wrong: `I need confirm the ${term}.`, fix: `I need to confirm the ${term}.`, reasonZh: "need 后接不定式 to do。" }
      ],
      tags: [unit.key, level.id]
    });
    expressionIndex += 1;
  }
}

const grammar = [];
let grammarIndex = 1;
while (grammar.length < 240) {
  const seed = grammarSeeds[grammar.length % grammarSeeds.length];
  const level = LEVELS[grammar.length % LEVELS.length];
  grammar.push({
    id: `g-${pad(grammarIndex, 3)}`,
    title: `${seed[0]} · ${level.label}`,
    level: level.id,
    ability: seed[2],
    oneLineZh: `${seed[2]}，用于${level.label}英语表达。`,
    scene: [
      example(`I use this structure when I explain a ${level.descriptor} idea.`, `说明${level.label}观点时使用该结构。`)
    ],
    formula: seed[1],
    examples: [
      example(`This lesson helps me understand the main idea.`, "这节课帮助我理解主旨。"),
      example(`The result depends on the context.`, "结果取决于语境。")
    ],
    commonErrors: [
      { wrong: "She go to class.", fix: "She goes to class.", reasonZh: "第三人称单数一般现在时需要 -s。" }
    ],
    microExercises: [
      "改写成疑问句。",
      "补全缺失动词。",
      "找出句子主干。",
      "用同一结构写一句自己的话。"
    ]
  });
  grammarIndex += 1;
}

const pronunciation = [];
let pronunciationIndex = 1;
for (const level of LEVELS) {
  for (let cycleIndex = 0; cycleIndex < level.cycles.length; cycleIndex += 1) {
    for (const seed of pronunciationSeeds) {
      pronunciation.push({
        id: `pr-${pad(pronunciationIndex, 2)}`,
        title: `${seed.title} · ${level.label} · ${level.cycles[cycleIndex]}`,
        level: level.id,
        focus: seed.title,
        explanationZh: `${seed.explanation}。先慢速模仿，再用自然语速跟读。`,
        examples: seed.examples,
        minimalPairs: seed.minimalPairs,
        selfCheck: ["是否能听出目标音差异", "是否能录音回听", "是否能在句子中保持节奏"]
      });
      pronunciationIndex += 1;
    }
  }
}

const getVocab = (id) => vocabulary.find((item) => item.id === id);
const exerciseHintGuides = {
  singleChoice: ["先听完整发音并判断音节与重音。", "逐项对照开头音、核心元音和词尾。"],
  multiChoice: ["先按本课真实场景给选项分类。", "题目要求选择两项，先排除属于其他场景的表达。"],
  listenWord: ["先听音节数量和重音位置。", "第二遍核对开头音、元音和词尾。"],
  listenSentence: ["先听主语、核心动词和句子语气。", "再核对否定词、时间、地点和对象等细节。"],
  imageChoice: ["先看图形和中文场景线索。", "把每个表达的实际用途与本课主题对应起来。"],
  letterOrder: ["先听音节，再观察可用字母数量。", "按发音顺序检查开头、元音组合和词尾。"],
  wordDictation: ["第一遍听整体发音，第二遍拆分音节。", "写完后检查元音组合和词尾。"],
  sentenceDictation: ["先记句子主干和大意。", "第二遍补功能词、大小写和标点。"],
  fillBlank: ["先判断空格承担的句子成分。", "结合前后搭配、主谓关系和词形要求判断。"],
  sentenceBuild: ["先找主语和核心谓语。", "判断陈述句或疑问句，再安排其余成分。"],
  conjugation: ["先确定时态和主语人称。", "检查一般现在时第三人称单数的动词形式。"],
  errorCorrection: ["先检查主语和谓语是否一致。", "再核对时态、人称和动词词形。"],
  accentRepair: ["先判断是否为英文缩写。", "检查省略字母的位置和 apostrophe。"],
  branchDialogue: ["先判断对方是在提问、请求还是确认。", "回应要直接、连贯并符合真实交流语气。"],
  shadowing: ["先听整句节奏，再按意群模仿。", "回听时检查重读、弱读、停顿和句尾语调。"],
  freeInput: ["先确定沟通目标，再写最短完整句。", "保证主语和谓语完整，再补一个真实细节。"],
  storyRetell: ["先说清场景，再找关键行动。", "按场景、行动、结果组织复述。"]
};

function exerciseBase({ id, type, prompt, answer, options, skill, refs, rule, metadata, promptAudioText, visualOptions, acceptableAnswers }) {
  const answerLabel = Array.isArray(answer) ? answer.join("、") : answer;
  const [light, deep] = exerciseHintGuides[type] ?? ["先明确题目考查的能力。", "结合题干限制逐项排除不符合要求的答案。"];
  return {
    id,
    type,
    prompt,
    promptAudioText,
    options: rotateOptions(options, id),
    answer,
    acceptableAnswers,
    skill,
    knowledgeRefs: refs,
    feedback: {
      light,
      rule: deep,
      full: `本题分析：${rule} 因此，正确答案是“${answerLabel}”。`
    },
    metadata,
    visualOptions
  };
}

function makeLessonExercises(lessonNumber, lesson, unit, level, refs) {
  const selectedTypes = Array.from({ length: 12 }, (_, index) => exerciseTypes[(lessonNumber + index - 1) % exerciseTypes.length]);
  const word = getVocab(refs.vocabularyIds[0]);
  const word2 = getVocab(refs.vocabularyIds[1]);
  const mainWord = word?.displayForm ?? "hello";
  const secondWord = word2?.displayForm ?? "question";
  const sentence = lesson.takeAway.spanish;
  const plainSentence = noPunct(sentence);
  const crossUnitForms = vocabulary.filter((item) => item.active && item.level === level.id && item.tags[0] !== unit.key).map((item) => item.displayForm);
  const options = makeOptions(mainWord, crossUnitForms);
  const meta = { unit: unit.title, level: level.label, lesson: lesson.title };
  const refsFor = (...ids) => unique([...ids, `k-lesson-${pad(lessonNumber, 3)}-01`]);
  return selectedTypes.map((type, index) => {
    const id = `ex-${pad(lessonNumber, 3)}-${pad(index + 1, 2)}`;
    const title = lesson.title;
    const prefix = `【${title}】`;
    const exerciseRef = `k-lesson-${pad(lessonNumber, 3)}-${pad(index + 1, 2)}`;
    if (type === "singleChoice") return exerciseBase({ id, type, prompt: `${prefix}播放音频，选择你听到的英语单词或短语。`, promptAudioText: mainWord, answer: mainWord, options, skill: "vocabulary", refs: refsFor(refs.vocabularyIds[0], exerciseRef), rule: `录音中的音节、重音和词尾与“${mainWord}”一致。`, metadata: meta });
    if (type === "multiChoice") return exerciseBase({ id, type, prompt: `${prefix}根据本课“${unit.title}”的词汇内容，选择两项属于本课的重点表达（选 2 项）。`, answer: [mainWord, secondWord], options: makeOptions(mainWord, [secondWord, ...crossUnitForms], 5), skill: "vocabulary", refs: refsFor(refs.vocabularyIds[0], refs.vocabularyIds[1], exerciseRef), rule: `“${mainWord}”和“${secondWord}”都属于“${unit.title}”场景，其余选项来自其他主题。`, metadata: meta });
    if (type === "listenWord") return exerciseBase({ id, type, prompt: `${prefix}播放音频，选择你听到的英语单词或短语。`, promptAudioText: mainWord, answer: mainWord, options, skill: "listening", refs: refsFor(refs.vocabularyIds[0], exerciseRef), rule: `录音中的音节、重音和词尾与“${mainWord}”一致。`, metadata: meta });
    if (type === "listenSentence") return exerciseBase({ id, type, prompt: `${prefix}播放音频，选择与录音内容完全一致的完整句子。`, promptAudioText: sentence, answer: sentence, options: makeOptions(sentence, [`I need more time for this task.`, `Could you repeat the question?`, `The meeting starts at nine.`]), skill: "listening", refs: refsFor(refs.patternIds[0], exerciseRef), rule: `录音中的主语、核心动词和细节共同对应“${sentence}”。`, metadata: meta });
    if (type === "imageChoice") return exerciseBase({ id, type, prompt: `${prefix}观察卡片中的图形和中文场景线索，选择属于“${unit.title}”场景的英语表达。`, answer: mainWord, options, skill: "vocabulary", refs: refsFor(refs.vocabularyIds[0], exerciseRef), rule: `“${mainWord}”对应的卡片属于“${unit.title}”场景。`, metadata: { ...meta, visualHint: unit.title }, visualOptions: visualOptionsFor(options) });
    if (type === "letterOrder") return exerciseBase({ id, type, prompt: `${prefix}播放音频，然后按正确顺序拼出你听到的单词。`, promptAudioText: mainWord.split(" ")[0], answer: mainWord.split(" ")[0], skill: "spelling", refs: refsFor(refs.vocabularyIds[0], exerciseRef), rule: `录音中的发音顺序对应字母组合“${mainWord.split(" ")[0]}”。`, metadata: meta });
    if (type === "wordDictation") return exerciseBase({ id, type, prompt: `${prefix}播放音频，写出你听到的英语单词或短语。`, promptAudioText: mainWord, answer: mainWord, skill: "spelling", refs: refsFor(refs.vocabularyIds[0], exerciseRef), rule: `录音中的发音可按音节对应到“${mainWord}”。`, metadata: meta });
    if (type === "sentenceDictation") return exerciseBase({ id, type, prompt: `${prefix}播放音频，写出完整句子；注意大小写和标点。`, promptAudioText: sentence, answer: sentence, skill: "listening", refs: refsFor(refs.patternIds[0], exerciseRef), rule: `录音的主干、功能词和细节组合成完整句子“${sentence}”。`, metadata: meta });
    if (type === "fillBlank") {
      const target = plainSentence.split(/\s+/).find((item) => item.length > 3) ?? "English";
      return exerciseBase({ id, type, prompt: `${prefix}${sentence.replace(target, "___")}（填入缺失内容）`, answer: target, skill: "grammar", refs: refsFor(refs.grammarIds[0], exerciseRef), rule: `空格处应填“${target}”。`, metadata: meta });
    }
    if (type === "sentenceBuild") return exerciseBase({ id, type, prompt: `${prefix}把词语排成正确英语句子。`, answer: plainSentence, skill: "grammar", refs: refsFor(refs.patternIds[0], exerciseRef), rule: `正确语序是“${plainSentence}”。`, metadata: meta });
    if (type === "conjugation") return exerciseBase({ id, type, prompt: `${prefix}补全：She ___ English every day.（practice）`, answer: "practices", skill: "grammar", refs: refsFor(refs.grammarIds[0], exerciseRef), rule: "第三人称单数一般现在时使用 practices。", metadata: meta });
    if (type === "errorCorrection") return exerciseBase({ id, type, prompt: `${prefix}修正句子：She go to English class every day.`, answer: "She goes to English class every day.", skill: "grammar", refs: refsFor(refs.grammarIds[0], exerciseRef), rule: "主语 she 后的一般现在时动词需要 -s。", metadata: meta });
    if (type === "accentRepair") return exerciseBase({ id, type, prompt: `${prefix}补回英文缩写符号：Im ready to answer.`, answer: "I'm ready to answer.", skill: "spelling", refs: refsFor(refs.pronunciationIds[0], exerciseRef), rule: "I'm 是 I am 的自然缩写，书写时需要 apostrophe。", metadata: meta });
    if (type === "shadowing") return exerciseBase({ id, type, prompt: `${prefix}跟读并录音回听：${sentence}`, promptAudioText: sentence, answer: sentence, skill: "speaking", refs: refsFor(refs.pronunciationIds[0], exerciseRef), rule: "跟读时先保证重音和停顿清楚。", metadata: meta });
    if (type === "branchDialogue") return exerciseBase({ id, type, prompt: `${prefix}听对方的话，选择合适的回应。`, promptAudioText: "Could you repeat that?", answer: "Sure. I will say it more slowly.", options: ["Sure. I will say it more slowly.", "No, never.", "Yesterday is blue.", "I bought a window."], skill: "speaking", refs: refsFor(refs.patternIds[0], exerciseRef), rule: "对方询问“Could you repeat that?”时，应确认并放慢语速。", metadata: meta });
    if (type === "freeInput") return exerciseBase({ id, type, prompt: `${prefix}请结合自己情况，用一句英语完成目标：${unit.goal}`, answer: sentence, acceptableAnswers: [sentence], skill: "speaking", refs: refsFor(refs.patternIds[0], exerciseRef), rule: `参考表达是“${sentence}”。你的答案可以不同，但应完成同一沟通目标。`, metadata: meta });
    return exerciseBase({ id, type, prompt: `${prefix}先听示范，再用一句英语复述微情境：${unit.sceneEn}。`, promptAudioText: sentence, answer: `${sentence} I handled the situation clearly.`, skill: "speaking", refs: refsFor(refs.patternIds[0], exerciseRef), rule: `参考复述可包含“${sentence}”。`, metadata: meta });
  });
}

const courses = [];
for (let levelIndex = 0; levelIndex < LEVELS.length; levelIndex += 1) {
  const level = LEVELS[levelIndex];
  for (let cycleIndex = 0; cycleIndex < level.cycles.length; cycleIndex += 1) {
    const cycleLabel = level.cycles[cycleIndex];
    for (let unitIndex = 0; unitIndex < UNITS.length; unitIndex += 1) {
      const unit = UNITS[unitIndex];
    const lessonNumber = courses.length + 1;
    const lessonKey = lessonKeyFor(unit, level, cycleIndex);
    const vocabularyIds = activeByLesson.get(lessonKey) ?? [];
    const patternIds = [
      sentencePatterns[(lessonNumber - 1) % sentencePatterns.length].id,
      sceneExpressions[(lessonNumber - 1) % sceneExpressions.length].id
    ];
    const grammarIds = [grammar[(lessonNumber - 1) % grammar.length].id];
    const pronunciationIds = [pronunciation[(lessonNumber - 1) % pronunciation.length].id];
    const takeAway = example(
      levelIndex === 0 ? unit.takeAway : `${unit.takeAway.replace(/\.$/, "")}, and I can explain it at ${level.short}.`,
      `${level.label}带走句：${unit.goal}。`
    );
    const lesson = {
      id: `lesson-${pad(lessonNumber, 3)}`,
      title: `${level.label}第${cycleIndex + 1}轮 · 第${unitIndex + 1}课 · ${unit.title}`,
      level: level.id,
      unit: `${level.label} · ${cycleLabel}`,
      minutes: level.minutes,
      realGoal: `${unit.goal}，并在“${unit.title}”场景中完成听、说、读、写闭环；本课属于${cycleLabel}。`,
      dialogue: [
        example(`A: ${unit.takeAway}`, `A：${unit.goal}`),
        example(`B: Could you say it again more slowly?`, "B：你能更慢地再说一遍吗？")
      ],
      vocabularyIds,
      patternIds,
      grammarIds,
      pronunciationIds,
      exercises: [],
      takeAway,
      cultureNote: "英语使用场景覆盖地区、年龄、职业和媒介差异。先保证表达清楚，再根据对象选择语气和口音。",
      keyPoints: [
        "先听关键词，再判断句子功能。",
        "用短句完成沟通目标，逐步扩展细节。",
        "录音回听时重点检查重音、停顿和结尾音。"
      ],
      commonPitfalls: [
        "逐词翻译导致语序不自然。",
        "忽略冠词、第三人称单数或句子重音。"
      ],
      completionChallenge: `用英语完成一个真实微任务：${unit.goal}；按${level.label}要求补充细节。`
    };
    lesson.exercises = makeLessonExercises(lessonNumber, lesson, unit, level, { vocabularyIds, patternIds, grammarIds, pronunciationIds });
    courses.push(lesson);
    }
  }
}

const cultureStories = [];
for (let index = 1; index <= 120; index += 1) {
  const unit = UNITS[(index - 1) % UNITS.length];
  const level = LEVELS[(index - 1) % LEVELS.length];
  const cycleIndex = Math.floor((index - 1) / UNITS.length) % level.cycles.length;
  const lessonKey = lessonKeyFor(unit, level, cycleIndex);
  const vocabIds = (activeByLesson.get(lessonKey) ?? []).slice(0, 3);
  const grammarId = grammar[(index - 1) % grammar.length].id;
  const title = `${unit.title}里的英语选择 ${index}`;
  const paragraphs = [
    `Mia arrives in a ${unit.sceneEn} situation and hears a phrase she has practiced before.`,
    `She notices that the speaker uses a clear tone, short sentences, and one polite question.`,
    `Instead of translating word by word, Mia listens for the key idea and answers with a complete sentence.`,
    `The conversation works because she chooses simple English, checks the detail, and stays respectful.`
  ];
  cultureStories.push({
    id: `story-${pad(index, 2)}`,
    title,
    region: index % 2 === 0 ? "UK/US 对照" : "国际英语",
    level: level.id,
    learningGoals: [
      "根据上下文区分事实、礼貌策略与人物行动",
      "用两到三句英语复述故事，并替换成自己的经历"
    ],
    spanishParagraphs: paragraphs,
    translationZh: [
      `Mia 进入一个“${unit.title}”场景，听到一个她练过的表达。`,
      "她注意到说话者使用清楚语气、短句和一个礼貌问题。",
      "她没有逐词翻译，而是抓住关键信息，并用完整句子回答。",
      "对话顺利，是因为她选择了简单英语、确认细节并保持尊重。"
    ],
    vocabularyIds: vocabIds,
    grammarIds: [grammarId],
    cultureNotes: [
      { title: "礼貌不是固定模板", bodyZh: "英语礼貌表达会随地区、关系和场景变化。清楚、具体、尊重通常比堆砌复杂词更可靠。" },
      { title: "口音不是错误", bodyZh: "美式、英式和国际英语口音都可以理解。训练重点是可懂度、节奏和关键词。" }
    ],
    comprehensionExercises: [
      exerciseBase({ id: `story-ex-${pad(index, 2)}-01`, type: "singleChoice", prompt: `故事中 Mia 先听出了什么？`, answer: "the key idea", options: ["the key idea", "a random number", "a song title", "a password"], skill: "reading", refs: [vocabIds[0], `k-story-${pad(index, 2)}-01`].filter(Boolean), rule: "她先抓住关键信息。", metadata: { title } }),
      exerciseBase({ id: `story-ex-${pad(index, 2)}-02`, type: "singleChoice", prompt: `故事中的有效策略是什么？`, answer: "checking the detail", options: ["checking the detail", "speaking faster", "ignoring the speaker", "using harder words"], skill: "reading", refs: [grammarId, `k-story-${pad(index, 2)}-02`], rule: "确认细节能降低误解。", metadata: { title } }),
      exerciseBase({ id: `story-ex-${pad(index, 2)}-03`, type: "multiChoice", prompt: `选择两个帮助沟通顺利的做法。`, answer: ["simple English", "respectful tone"], options: ["simple English", "respectful tone", "silent guessing", "long memorized speech"], skill: "reading", refs: [vocabIds[1], grammarId, `k-story-${pad(index, 2)}-03`].filter(Boolean), rule: "简单英语和尊重语气更适合真实沟通。", metadata: { title } }),
      exerciseBase({ id: `story-ex-${pad(index, 2)}-04`, type: "storyRetell", prompt: `用两到三句英语复述“${title}”，至少提到场景、关键事件和解决方式。`, answer: `${paragraphs[0]} ${paragraphs[3]}`, skill: "speaking", refs: [vocabIds[2], grammarId, `k-story-${pad(index, 2)}-04`].filter(Boolean), rule: "复述应包含场景、人物行动和结果。", metadata: { title } })
    ],
    outputTask: {
      promptZh: `把故事改成你自己的“${unit.title}”经历，用 2 到 3 句英语表达。`,
      exampleAnswer: `I was in a ${unit.sceneEn} situation. I used simple English and checked the key detail.`
    }
  });
}

const summary = {
  stats: {
    activeVocabulary: vocabulary.filter((item) => item.active).length,
    recognitionVocabulary: vocabulary.filter((item) => !item.active).length,
    sentencePatterns: sentencePatterns.length,
    sceneExpressions: sceneExpressions.length,
    grammar: grammar.length,
    pronunciation: pronunciation.length,
    cultureStories: cultureStories.length,
    courses: courses.length,
    exercises: courses.reduce((sum, lesson) => sum + lesson.exercises.length, 0)
  },
  courses: courses.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    level: lesson.level,
    unit: lesson.unit,
    minutes: lesson.minutes,
    realGoal: lesson.realGoal,
    exerciseCount: lesson.exercises.length
  }))
};

writeJson("vocabulary.json", vocabulary);
writeJson("sentence-patterns.json", sentencePatterns);
writeJson("scene-expressions.json", sceneExpressions);
writeJson("grammar.json", grammar);
writeJson("pronunciation.json", pronunciation);
writeJson("culture-stories.json", cultureStories);
writeJson("courses.json", courses);
writeJson("summary.json", summary);

console.log("English content generated", summary.stats);
