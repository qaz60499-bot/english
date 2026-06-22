import { CheckCircle2, RotateCcw, Volume2, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Exercise, ExerciseResult } from "../../types/content";
import { buildExerciseResult, evaluateExercise, formatExerciseAnswer, normalizeAnswer } from "../../engines/lessonEngine";
import { SpeechPanel } from "../pronunciation/SpeechPanel";
import { describeSpeechPlayback, getSpeechSupport, resolveSpeechLang, speak } from "../../engines/speechEngine";
import { useLearningStore } from "../../stores/useLearningStore";
import type { SavedExerciseAnswer } from "../../services/storage";

interface ExerciseRendererProps {
  exercise: Exercise;
  savedAnswer?: SavedExerciseAnswer;
  onComplete: (result: ExerciseResult, answer: string | string[]) => void | Promise<void>;
}

interface BuilderToken {
  id: string;
  label: string;
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deterministicShuffle(values: string[], seed: string): BuilderToken[] {
  return values
    .map((label, index) => ({ id: `${index}-${label}`, label, order: hashText(`${seed}-${index}-${label}`) }))
    .sort((a, b) => a.order - b.order)
    .map(({ id, label }) => ({ id, label }));
}



function restoreBuilderTokenIds(rawAnswer: string | string[], tokens: BuilderToken[], sentenceMode: boolean) {
  const raw = Array.isArray(rawAnswer) ? rawAnswer.join(sentenceMode ? " " : "") : rawAnswer;
  const labels = sentenceMode ? raw.trim().split(/\s+/).filter(Boolean) : Array.from(raw.replace(/\s+/g, ""));
  const remaining = [...tokens];
  const ids: string[] = [];
  for (const label of labels) {
    const index = remaining.findIndex((token) => token.label === label);
    if (index < 0) return [];
    ids.push(remaining[index].id);
    remaining.splice(index, 1);
  }
  return ids;
}


const visualCueRules: Array<{ pattern: RegExp; emoji: string; label: string }> = [
  { pattern: /coffee|tea|water|juice|drink|milk/i, emoji: "☕", label: "饮料" },
  { pattern: /table|restaurant|menu|soup|salad|dish|meal|bill|eat/i, emoji: "🍽️", label: "餐厅" },
  { pattern: /hotel|room|booking|reception|luggage|suitcase/i, emoji: "🏨", label: "酒店与行李" },
  { pattern: /plane|flight|airport|boarding|gate/i, emoji: "✈️", label: "机场与航班" },
  { pattern: /metro|train|bus|station|platform|line|ticket/i, emoji: "🚉", label: "交通" },
  { pattern: /right|left|straight|street|square|map|where/i, emoji: "🧭", label: "方向与地点" },
  { pattern: /shirt|jacket|shoes|size|fitting room|cost|discount/i, emoji: "🛍️", label: "购物" },
  { pattern: /doctor|pharmacy|pain|fever|cough|medicine|tablet/i, emoji: "🩺", label: "健康" },
  { pattern: /family|mother|father|brother|sister|friend|teacher/i, emoji: "👥", label: "人物与家庭" },
  { pattern: /time|monday|tuesday|wednesday|thursday|friday|date|minutes/i, emoji: "🕒", label: "时间" },
  { pattern: /work|meeting|report|project|file|email/i, emoji: "💼", label: "学习与工作" },
  { pattern: /happy|nervous|worried|feel|opinion|agree/i, emoji: "💬", label: "感受与观点" },
  { pattern: /music|movie|story|travel|culture/i, emoji: "🎬", label: "文化与经历" },
  { pattern: /hello|morning|name|meet|nice/i, emoji: "👋", label: "问候与介绍" }
];

function visualCueForText(text: string): { emoji: string; label: string; descriptionZh?: string } {
  const match = visualCueRules.find((rule) => rule.pattern.test(text));
  return match ?? { emoji: "🗂️", label: "情境卡" };
}

const exerciseTypeLabels: Partial<Record<Exercise["type"], string>> = {
  singleChoice: "单项选择",
  multiChoice: "多项选择",
  listenWord: "听音辨词",
  listenSentence: "听句选择",
  imageChoice: "情境选择",
  letterOrder: "字母排序",
  wordDictation: "单词听写",
  sentenceDictation: "句子听写",
  fillBlank: "填空练习",
  sentenceBuild: "句子拼装",
  conjugation: "词形变化",
  errorCorrection: "改错练习",
  accentRepair: "重音修正",
  shadowing: "跟读训练",
  branchDialogue: "情境对话",
  freeInput: "自由表达",
  storyRetell: "故事复述"
};

function displayAnswer(value: string | string[]) {
  if (Array.isArray(value)) return value.join("、");
  return value || "未作答";
}

export function ExerciseRenderer({ exercise, savedAnswer, onComplete }: ExerciseRendererProps) {
  const isOpenResponse = exercise.type === "freeInput" || exercise.type === "storyRetell";
  const isShadowing = exercise.type === "shadowing";
  const isSelfAssessment = isOpenResponse || isShadowing;
  const isMulti = exercise.type === "multiChoice";
  const isSentenceBuilder = exercise.type === "sentenceBuild";
  const isLetterBuilder = exercise.type === "letterOrder";
  const needsText = ["wordDictation", "sentenceDictation", "fillBlank", "conjugation", "errorCorrection", "accentRepair"].includes(exercise.type);

  const [answer, setAnswer] = useState<string | string[]>(savedAnswer?.answer ?? "");
  const [submitted, setSubmitted] = useState(Boolean(savedAnswer));
  const [correct, setCorrect] = useState(Boolean(savedAnswer?.correct));
  const [hasRecorded, setHasRecorded] = useState(Boolean(savedAnswer));
  const [hintCount, setHintCount] = useState(0);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [correctionMode, setCorrectionMode] = useState(false);
  const [corrected, setCorrected] = useState(Boolean(savedAnswer?.corrected));
  const [referenceRevealed, setReferenceRevealed] = useState(Boolean(savedAnswer && isOpenResponse));
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [audioMessage, setAudioMessage] = useState("");
  const speechSupport = useMemo(() => getSpeechSupport(), []);
  const accent = useLearningStore((state) => state.preferences?.accent ?? "auto");
  const speechLang = resolveSpeechLang(accent);
  const [hasListened, setHasListened] = useState(Boolean(savedAnswer));
  const [hasLocalRecording, setHasLocalRecording] = useState(Boolean(savedAnswer));
  const [recordingUnavailable, setRecordingUnavailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  const selectedValues = useMemo(() => (Array.isArray(answer) ? answer : answer ? [answer] : []), [answer]);
  const expectedAnswers = useMemo(
    () => (Array.isArray(exercise.answer) ? exercise.answer : [exercise.answer]).map(normalizeAnswer),
    [exercise.answer]
  );

  const builderTokens = useMemo(() => {
    if (isSentenceBuilder) {
      const source = Array.isArray(exercise.answer) ? exercise.answer.join(" ") : exercise.answer;
      return deterministicShuffle(source.trim().split(/\s+/).filter(Boolean), exercise.id);
    }
    if (isLetterBuilder) {
      const source = Array.isArray(exercise.answer) ? exercise.answer.join("") : exercise.answer;
      return deterministicShuffle(Array.from(source.replace(/\s+/g, "")), exercise.id);
    }
    return [] as BuilderToken[];
  }, [exercise.answer, exercise.id, isLetterBuilder, isSentenceBuilder]);

  const selectedBuilderTokens = selectedTokenIds
    .map((id) => builderTokens.find((token) => token.id === id))
    .filter((token): token is BuilderToken => Boolean(token));

  useEffect(() => {
    setAnswer(savedAnswer?.answer ?? "");
    setSubmitted(Boolean(savedAnswer));
    setCorrect(Boolean(savedAnswer?.correct));
    setHasRecorded(Boolean(savedAnswer));
    setHintCount(0);
    setStartedAt(Date.now());
    setCorrectionMode(false);
    setCorrected(Boolean(savedAnswer?.corrected));
    setReferenceRevealed(Boolean(savedAnswer && (exercise.type === "freeInput" || exercise.type === "storyRetell")));
    setSelectedTokenIds(
      savedAnswer && (isSentenceBuilder || isLetterBuilder)
        ? restoreBuilderTokenIds(savedAnswer.answer, builderTokens, isSentenceBuilder)
        : []
    );
    setAudioMessage("");
    setHasListened(Boolean(savedAnswer));
    setHasLocalRecording(Boolean(savedAnswer));
    setRecordingUnavailable(false);
    setSubmitting(false);
    submitLockRef.current = false;
  }, [exercise.id, savedAnswer?.submittedAt, savedAnswer?.corrected, builderTokens, isLetterBuilder, isSentenceBuilder]);

  function choose(value: string) {
    if (submitted) return;
    if (!isMulti) {
      setAnswer(value);
      return;
    }
    setAnswer(selectedValues.includes(value) ? selectedValues.filter((item) => item !== value) : [...selectedValues, value]);
  }

  function chooseBuilderToken(token: BuilderToken) {
    if (submitted || selectedTokenIds.includes(token.id)) return;
    const nextIds = [...selectedTokenIds, token.id];
    setSelectedTokenIds(nextIds);
    const nextLabels = nextIds
      .map((id) => builderTokens.find((item) => item.id === id)?.label)
      .filter((item): item is string => Boolean(item));
    setAnswer(isSentenceBuilder ? nextLabels.join(" ") : nextLabels.join(""));
  }

  function removeBuilderToken(index: number) {
    if (submitted) return;
    const nextIds = selectedTokenIds.filter((_, itemIndex) => itemIndex !== index);
    setSelectedTokenIds(nextIds);
    const nextLabels = nextIds
      .map((id) => builderTokens.find((item) => item.id === id)?.label)
      .filter((item): item is string => Boolean(item));
    setAnswer(isSentenceBuilder ? nextLabels.join(" ") : nextLabels.join(""));
  }

  async function submitObjective() {
    if (submitted || submitLockRef.current) return;
    submitLockRef.current = true;
    setSubmitting(true);
    const result = buildExerciseResult({
      exercise,
      answer,
      firstTry: !hasRecorded && !correctionMode,
      hintCount,
      startedAt
    });
    setSubmitted(true);
    setCorrect(result.correct);
    setCorrected(correctionMode && result.correct);
    setHasRecorded(true);
    try {
      await onComplete(result, answer);
    } finally {
      submitLockRef.current = false;
      setSubmitting(false);
    }
  }

  function revealReference() {
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return;
    setReferenceRevealed(true);
    setSubmitted(true);
  }

  async function completeSelfAssessment(isConfident: boolean) {
    if (hasRecorded || submitLockRef.current) return;
    submitLockRef.current = true;
    setSubmitting(true);
    const submittedAnswer = isShadowing ? (isConfident ? "已完成跟读" : "需要继续练习") : answer;
    const result = buildExerciseResult({
      exercise,
      answer: submittedAnswer,
      firstTry: !correctionMode,
      hintCount,
      startedAt,
      correctOverride: isConfident
    });
    setAnswer(submittedAnswer);
    setCorrect(isConfident);
    setSubmitted(true);
    setHasRecorded(true);
    try {
      await onComplete(result, submittedAnswer);
    } finally {
      submitLockRef.current = false;
      setSubmitting(false);
    }
  }

  async function playCorrectAnswer() {
    setAudioMessage("正在准备英语语音…");
    const result = await speak(formatExerciseAnswer(exercise), { rate: 0.82, lang: speechLang });
    if (result.reason === "cancelled") return;
    setAudioMessage(describeSpeechPlayback(result, speechLang));
  }

  function retry() {
    if (submitLockRef.current) return;
    setSubmitted(false);
    setCorrect(false);
    setCorrected(false);
    setCorrectionMode(true);
    setAnswer("");
    setSelectedTokenIds([]);
    setHintCount(0);
    setStartedAt(Date.now());
    setAudioMessage("");
    setReferenceRevealed(false);
    setHasRecorded(false);
    setHasListened(false);
    setHasLocalRecording(false);
    setRecordingUnavailable(false);
  }

  const hasAnswer = Array.isArray(answer) ? answer.length > 0 : answer.trim().length > 0;
  const shouldShowSpeech = Boolean(exercise.promptAudioText) || isShadowing;
  const shadowingReady = hasListened && (hasLocalRecording || recordingUnavailable || !speechSupport.recording);

  return (
    <article className="lesson-runner exercise-card">
      <header className="exercise-heading">
        <span className="badge exercise-type-badge">{exerciseTypeLabels[exercise.type] ?? exercise.type}</span>
        <h2>{exercise.prompt}</h2>
        <p>先看清题意再作答；提示只提供分析方向，不会提前显示答案。</p>
      </header>

      {shouldShowSpeech && (
        <SpeechPanel
          text={exercise.promptAudioText ?? formatExerciseAnswer(exercise)}
          onPlayback={isShadowing ? () => setHasListened(true) : undefined}
          onRecordingReady={isShadowing ? setHasLocalRecording : undefined}
          onRecordingFallback={isShadowing ? () => setRecordingUnavailable(true) : undefined}
        />
      )}

      {isShadowing ? (
        <div className="self-check-card">
          <p>先播放标准音，再录下自己的声音回听。完成这两步后才能自评，录音不会上传。</p>
          {!hasRecorded && (
            <div className="shadowing-checklist" aria-live="polite">
              <span className={hasListened ? "is-done" : ""}>① 已听标准音</span>
              <span className={hasLocalRecording || recordingUnavailable || !speechSupport.recording ? "is-done" : ""}>② {hasLocalRecording ? "已完成录音" : recordingUnavailable || !speechSupport.recording ? "已改为口头跟读" : "等待录音回听"}</span>
            </div>
          )}
          {!hasRecorded ? (
            <div className="toolbar">
              <button className="button" type="button" onClick={() => void completeSelfAssessment(true)} disabled={!shadowingReady || submitting}>
                <CheckCircle2 size={18} aria-hidden="true" />
                我已完成跟读
              </button>
              <button className="button secondary" type="button" onClick={() => void completeSelfAssessment(false)} disabled={!shadowingReady || submitting}>
                还需要再练
              </button>
            </div>
          ) : (
            <div className={`feedback-card ${correct ? "is-correct" : "is-wrong"}`} aria-live="polite">
              <p>{correct ? "已记录本次跟读。下一次可尝试常速播放。" : "已加入重点复习。建议再听一次慢速音并对照节奏。"}</p>
              {!correct && (
                <button className="button secondary" type="button" onClick={retry} disabled={submitting}>
                  <RotateCcw size={18} aria-hidden="true" />
                  重新跟读
                </button>
              )}
            </div>
          )}
        </div>
      ) : isOpenResponse ? (
        <>
          <label className="field">
            你的表达
            <textarea
              value={Array.isArray(answer) ? answer.join(" ") : answer}
              onChange={(event) => setAnswer(event.target.value)}
              disabled={submitted}
              aria-describedby={`${exercise.id}-feedback`}
              placeholder="先独立写出你的答案，不要求和参考答案一模一样。"
            />
          </label>
          {!referenceRevealed ? (
            <button className="button" type="button" onClick={revealReference} disabled={!hasAnswer}>
              查看参考答案并自评
            </button>
          ) : (
            <section className="answer-comparison" id={`${exercise.id}-feedback`} aria-live="polite">
              <div>
                <span>你的表达</span>
                <strong>{displayAnswer(answer)}</strong>
              </div>
              <div>
                <span>参考表达</span>
                <strong lang="en">{formatExerciseAnswer(exercise)}</strong>
              </div>
              <p>{exercise.feedback.full}</p>
              {!hasRecorded && (
                <div className="toolbar">
                  <button className="button" type="button" onClick={() => void completeSelfAssessment(true)} disabled={submitting}>
                    表达基本完整
                  </button>
                  <button className="button secondary" type="button" onClick={() => void completeSelfAssessment(false)} disabled={submitting}>
                    还需要练习
                  </button>
                </div>
              )}
              {hasRecorded && (
                <div className="toolbar">
                  <p className={correct ? "result-label is-correct" : "result-label is-wrong"}>{correct ? "已记录为基本掌握" : "已加入重点复习"}</p>
                  {!correct && (
                    <button className="button secondary" type="button" onClick={retry} disabled={submitting}>
                      <RotateCcw size={18} aria-hidden="true" />
                      重新表达
                    </button>
                  )}
                </div>
              )}
            </section>
          )}
        </>
      ) : needsText ? (
        <label className="field">
          你的答案
          <textarea
            value={Array.isArray(answer) ? answer.join(", ") : answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={submitted}
            aria-describedby={`${exercise.id}-feedback`}
          />
        </label>
      ) : isSentenceBuilder || isLetterBuilder ? (
        <div className="builder" aria-label={isSentenceBuilder ? "句子拼装" : "字母排序"}>
          <div className="builder-answer" aria-live="polite">
            {selectedBuilderTokens.length > 0 ? (
              selectedBuilderTokens.map((token, index) => (
                <button key={`${token.id}-selected`} type="button" onClick={() => removeBuilderToken(index)} disabled={submitted}>
                  {token.label}
                </button>
              ))
            ) : (
              <span>{isSentenceBuilder ? "按正确顺序点击词语" : "按正确顺序点击字母"}</span>
            )}
          </div>
          <div className="builder-bank">
            {builderTokens.map((token) => (
              <button
                key={token.id}
                type="button"
                onClick={() => chooseBuilderToken(token)}
                disabled={submitted || selectedTokenIds.includes(token.id)}
              >
                {token.label}
              </button>
            ))}
          </div>
        </div>
      ) : exercise.type === "imageChoice" ? (
        <div className="visual-option-list" role="group" aria-label="图片情境选项">
          {(exercise.options ?? []).map((option) => {
            const selected = selectedValues.includes(option);
            const optionCorrect = expectedAnswers.includes(normalizeAnswer(option));
            const cue = exercise.visualOptions?.[option] ?? visualCueForText(option);
            const stateClass = submitted
              ? optionCorrect
                ? "is-correct"
                : selected
                  ? "is-wrong"
                  : ""
              : selected
                ? "is-selected"
                : "";
            return (
              <button
                key={option}
                className={`visual-option ${stateClass}`.trim()}
                type="button"
                aria-pressed={selected}
                onClick={() => choose(option)}
                disabled={submitted}
              >
                <span className="visual-option-art" aria-hidden="true">{cue.emoji}</span>
                <span className="visual-option-label">{cue.label}</span>
                {cue.descriptionZh && <small>{cue.descriptionZh}</small>}
                <strong lang="en">{option}</strong>
                {submitted && optionCorrect && <CheckCircle2 size={20} aria-label="正确答案" />}
                {submitted && selected && !optionCorrect && <XCircle size={20} aria-label="你的答案不正确" />}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="option-list" role="group" aria-label="答案选项">
          {(exercise.options ?? []).map((option, optionIndex) => {
            const selected = selectedValues.includes(option);
            const optionCorrect = expectedAnswers.includes(normalizeAnswer(option));
            const stateClass = submitted
              ? optionCorrect
                ? "is-correct"
                : selected
                  ? "is-wrong"
                  : ""
              : selected
                ? "is-selected"
                : "";
            return (
              <button
                key={option}
                className={`option-button ${stateClass}`.trim()}
                type="button"
                aria-pressed={selected}
                onClick={() => choose(option)}
                disabled={submitted}
              >
                <span className="option-label">
                  <span className="option-key" aria-hidden="true">{String.fromCharCode(65 + optionIndex)}</span>
                  <span>{option}</span>
                </span>
                {submitted && optionCorrect && <CheckCircle2 size={18} aria-label="正确答案" />}
                {submitted && selected && !optionCorrect && <XCircle size={18} aria-label="你的答案不正确" />}
              </button>
            );
          })}
        </div>
      )}

      {!isSelfAssessment && (
        <>
          <div className="exercise-submit-bar">
            <p className="action-guidance">
              {submitted ? "本题结果已记录，可查看解析或继续下一步。" : hasAnswer ? "答案已选择，提交后会立即给出反馈。" : "完成作答后即可提交。"}
            </p>
            <div className="toolbar exercise-submit-actions">
              <button
                className="button secondary hint-action"
                type="button"
                onClick={() => setHintCount((value) => Math.min(2, value + 1))}
                disabled={submitted || hintCount >= 2}
              >
                {hintCount === 0 ? "给我一个提示" : hintCount === 1 ? "再提示一点" : "提示已展开"}
              </button>
              <button className="button submit-action" type="button" onClick={() => void submitObjective()} disabled={!hasAnswer || submitted || submitting}>
                {submitting ? "正在保存" : submitted ? "已提交" : correctionMode ? "提交订正" : "提交答案"}
              </button>
            </div>
          </div>

          {hintCount > 0 && !submitted && (
            <p className="hint-card" id={`${exercise.id}-hint`}>
              <strong>{hintCount === 1 ? "分析提示 1：" : "分析提示 2："}</strong>
              {hintCount === 1 ? exercise.feedback.light : exercise.feedback.rule}
            </p>
          )}

          {submitted && (
            <section className={`feedback-card ${correct ? "is-correct" : "is-wrong"}`} id={`${exercise.id}-feedback`} aria-live="polite">
              <div className="feedback-title">
                {correct ? <CheckCircle2 size={22} aria-hidden="true" /> : <XCircle size={22} aria-hidden="true" />}
                <strong>{correct ? (corrected ? "订正正确" : "回答正确") : "这题还没有答对"}</strong>
              </div>
              {!correct && (
                <div className="answer-comparison compact">
                  <div>
                    <span>你的答案</span>
                    <strong>{displayAnswer(answer)}</strong>
                  </div>
                  <div>
                    <span>正确答案</span>
                    <strong lang="en">{formatExerciseAnswer(exercise)}</strong>
                  </div>
                </div>
              )}
              <p>{exercise.feedback.full}</p>
              {!correct && (
                <div className="toolbar">
                  <button className="button secondary" type="button" onClick={retry} disabled={submitting}>
                    <RotateCcw size={18} aria-hidden="true" />
                    重新作答
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => void playCorrectAnswer()}
                  >
                    <Volume2 size={18} aria-hidden="true" />
                    播放正确答案
                  </button>
                </div>
              )}
              {audioMessage && <p className="audio-message">{audioMessage}</p>}
            </section>
          )}
        </>
      )}
    </article>
  );
}
