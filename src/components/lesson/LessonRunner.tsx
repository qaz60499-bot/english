import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resolvePrimaryKnowledgeId } from "../../engines/lessonEngine";
import { useLearningStore } from "../../stores/useLearningStore";
import type { ExerciseResult, Lesson } from "../../types/content";
import { ExerciseRenderer } from "./ExerciseRenderer";
import type { SavedExerciseAnswer } from "../../services/storage";
import { getDailyExerciseTarget } from "../../engines/learningPlan";

interface LessonRunnerProps {
  lesson: Lesson;
}

const validMapLevels = new Set(["ALL", "BASIC", "CET4", "CET6", "IELTS", "TOEFL"]);
const validMapStatuses = new Set(["ALL", "todo", "doing", "done"]);

function buildMapReturnPath(search: string, lesson: Pick<Lesson, "level" | "unit">, mode: "exit" | "completed") {
  const source = new URLSearchParams(search);
  const target = new URLSearchParams();
  const requestedLevel = source.get("mapLevel");
  const requestedStatus = source.get("mapStatus");
  const requestedChapter = source.get("mapChapter");
  const validRequestedStatus = requestedStatus && validMapStatuses.has(requestedStatus) ? requestedStatus : "ALL";
  const returnStatus = mode === "completed"
    ? validRequestedStatus === "ALL" ? "ALL" : "done"
    : validRequestedStatus === "ALL" ? "ALL" : "doing";

  target.set("level", requestedLevel && validMapLevels.has(requestedLevel) ? requestedLevel : lesson.level);
  target.set("status", returnStatus);
  target.set("chapter", requestedChapter && requestedChapter.length <= 120 ? requestedChapter : lesson.unit);

  return `/map?${target.toString()}`;
}

function summarizeAnswers(answers: Record<string, SavedExerciseAnswer>) {
  const rows = Object.values(answers);
  return {
    answered: rows.length,
    firstTryCorrect: rows.filter((item) => item.firstTryCorrect ?? (item.attempts <= 1 && item.correct)).length,
    mastered: rows.filter((item) => item.correct).length,
    corrected: rows.filter((item) => item.corrected).length,
    skipped: rows.filter((item) => item.skipped).length
  };
}

export function LessonRunner({ lesson }: LessonRunnerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const savedProgress = useLearningStore((state) => state.progress.find((item) => item.lessonId === lesson.id));
  const initialAnswers = savedProgress?.answers ?? {};
  const [answers, setAnswers] = useState<Record<string, SavedExerciseAnswer>>(initialAnswers);
  const answersRef = useRef<Record<string, SavedExerciseAnswer>>(initialAnswers);
  const [step, setStep] = useState(savedProgress?.completed ? 0 : savedProgress?.currentStep ?? 0);
  const [completed, setCompleted] = useState(Boolean(savedProgress?.completed));
  const [startedAt, setStartedAt] = useState(savedProgress?.startedAt ?? new Date().toISOString());
  const [saving, setSaving] = useState(false);
  const recordResult = useLearningStore((state) => state.recordResult);
  const saveProgress = useLearningStore((state) => state.saveProgress);
  const recordActivity = useLearningStore((state) => state.recordActivity);
  const preferences = useLearningStore((state) => state.preferences);
  const activities = useLearningStore((state) => state.activities);
  const exercise = lesson.exercises[step];
  const progress = Math.round(((step + 1) / Math.max(lesson.exercises.length, 1)) * 100);
  const savedAnswer = exercise ? answers[exercise.id] : undefined;
  const canAdvance = Boolean(savedAnswer) && !saving;

  const summary = useMemo(() => summarizeAnswers(answers), [answers]);
  const dailyTarget = getDailyExerciseTarget(lesson.exercises.length, lesson.minutes, preferences);
  const dailyPlanAlreadyRecorded = activities.some((activity) =>
    activity.type === "session" && activity.referenceId === lesson.id && new Date(activity.completedAt).toDateString() === new Date().toDateString()
  );
  const showDailyCheckpoint = dailyTarget < lesson.exercises.length && summary.answered >= dailyTarget && !dailyPlanAlreadyRecorded;
  const mapReturnPath = useMemo(
    () => buildMapReturnPath(location.search, lesson, "exit"),
    [lesson, location.search]
  );
  const completedMapReturnPath = useMemo(
    () => buildMapReturnPath(location.search, lesson, "completed"),
    [lesson, location.search]
  );

  function commitAnswers(nextAnswers: Record<string, SavedExerciseAnswer>) {
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);
  }

  async function onResult(result: ExerciseResult, submittedAnswer: string | string[]) {
    if (saving) return;
    setSaving(true);
    try {
      const currentAnswers = answersRef.current;
      const previous = currentAnswers[result.exerciseId];
      const attempts = (previous?.attempts ?? 0) + 1;
      const firstTryCorrect = previous?.firstTryCorrect ?? result.correct;
      const corrected = Boolean(previous?.corrected || (previous && !previous.correct && result.correct));
      const answerRecord: SavedExerciseAnswer = {
        exerciseId: result.exerciseId,
        answer: submittedAnswer,
        correct: result.correct,
        firstTryCorrect,
        corrected,
        skipped: false,
        attempts,
        submittedAt: result.answeredAt
      };
      const nextAnswers = { ...currentAnswers, [result.exerciseId]: answerRecord };
      commitAnswers(nextAnswers);
      await recordResult(result);
      await saveProgress({
        lessonId: lesson.id,
        currentStep: step,
        completed: false,
        status: previous ? "relearning" : "in_progress",
        startedAt,
        answers: nextAnswers,
        updatedAt: new Date().toISOString()
      });
    } finally {
      setSaving(false);
    }
  }

  async function skipCurrent() {
    if (!exercise || answersRef.current[exercise.id] || saving) return;
    setSaving(true);
    try {
      const answeredAt = new Date().toISOString();
      const skippedAnswer: SavedExerciseAnswer = {
        exerciseId: exercise.id,
        answer: "",
        correct: false,
        firstTryCorrect: false,
        skipped: true,
        attempts: 0,
        submittedAt: answeredAt
      };
      const nextAnswers = { ...answersRef.current, [exercise.id]: skippedAnswer };
      commitAnswers(nextAnswers);
      await recordResult({
        exerciseId: exercise.id,
        knowledgeItemId: resolvePrimaryKnowledgeId(exercise),
        skill: exercise.skill,
        correct: false,
        firstTry: true,
        hintCount: 2,
        responseTime: 0,
        requiresProduction: ["freeInput", "storyRetell", "shadowing", "sentenceBuild", "sentenceDictation"].includes(exercise.type),
        errorType: "skipped",
        answeredAt
      });
      await saveProgress({
        lessonId: lesson.id,
        currentStep: step,
        completed: false,
        status: "in_progress",
        startedAt,
        answers: nextAnswers,
        updatedAt: new Date().toISOString()
      });
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    if (!canAdvance || !exercise) return;
    setSaving(true);
    try {
      const currentAnswers = answersRef.current;
      if (step + 1 >= lesson.exercises.length) {
        const completedAt = new Date().toISOString();
        const finalSummary = summarizeAnswers(currentAnswers);
        await saveProgress({
          lessonId: lesson.id,
          currentStep: step,
          completed: true,
          status: "completed",
          startedAt,
          answers: currentAnswers,
          updatedAt: completedAt
        });
        await recordActivity({
          type: "lesson",
          referenceId: lesson.id,
          itemCount: lesson.exercises.length,
          correctCount: finalSummary.firstTryCorrect,
          completedAt
        });
        setCompleted(true);
        return;
      }
      const nextStep = step + 1;
      await saveProgress({
        lessonId: lesson.id,
        currentStep: nextStep,
        completed: false,
        status: "in_progress",
        startedAt,
        answers: currentAnswers,
        updatedAt: new Date().toISOString()
      });
      setStep(nextStep);
      window.requestAnimationFrame(() => {
        document.querySelector(".lesson-session")?.scrollIntoView();
      });
    } finally {
      setSaving(false);
    }
  }

  async function finishDailyPlan() {
    if (saving || dailyPlanAlreadyRecorded) return;
    setSaving(true);
    try {
      const completedAt = new Date().toISOString();
      await saveProgress({
        lessonId: lesson.id,
        currentStep: step,
        completed: false,
        status: "in_progress",
        startedAt,
        answers: answersRef.current,
        updatedAt: completedAt
      });
      const currentSummary = summarizeAnswers(answersRef.current);
      await recordActivity({
        type: "session",
        referenceId: lesson.id,
        itemCount: currentSummary.answered,
        correctCount: currentSummary.firstTryCorrect,
        completedAt
      });
      navigate("/");
    } finally {
      setSaving(false);
    }
  }

  async function exitAndSave() {
    if (saving) return;
    setSaving(true);
    try {
      await saveProgress({
        lessonId: lesson.id,
        currentStep: step,
        completed: false,
        status: savedProgress?.status === "relearning" ? "relearning" : "in_progress",
        startedAt,
        answers: answersRef.current,
        updatedAt: new Date().toISOString()
      });
      navigate(mapReturnPath);
    } finally {
      setSaving(false);
    }
  }

  async function restart() {
    if (saving) return;
    setSaving(true);
    try {
      const nextStartedAt = new Date().toISOString();
      commitAnswers({});
      setStep(0);
      setCompleted(false);
      setStartedAt(nextStartedAt);
      await saveProgress({
        lessonId: lesson.id,
        currentStep: 0,
        completed: false,
        status: "relearning",
        startedAt: nextStartedAt,
        answers: {},
        updatedAt: new Date().toISOString()
      });
    } finally {
      setSaving(false);
    }
  }

  if (completed) {
    const firstTryScore = lesson.exercises.length > 0 ? Math.round((summary.firstTryCorrect / lesson.exercises.length) * 100) : 0;
    const masteryScore = lesson.exercises.length > 0 ? Math.round((summary.mastered / lesson.exercises.length) * 100) : 0;
    return (
      <section className="panel lesson-runner completion-card">
        <CheckCircle2 size={42} aria-hidden="true" />
        <div>
          <span className="eyebrow">本课完成</span>
          <h2>{masteryScore >= 80 ? "核心内容已经掌握" : "课程已完成，薄弱项已进入复习"}</h2>
        </div>
        <div className="completion-stats" aria-label="本课成绩">
          <div><strong>{firstTryScore}%</strong><span>首次正确率</span></div>
          <div><strong>{masteryScore}%</strong><span>订正后掌握度</span></div>
          <div><strong>{summary.corrected}</strong><span>本课已订正</span></div>
          <div><strong>{lesson.exercises.length - summary.mastered}</strong><span>仍待巩固</span></div>
        </div>
        <p className="take-away">
          <span>今天带走的句子</span>
          <strong lang="en">{lesson.takeAway.spanish}</strong>
          <span>{lesson.takeAway.zh}</span>
        </p>
        <div className="toolbar">
          <button className="button secondary" type="button" onClick={() => void restart()} disabled={saving}>重学本课</button>
          <Link className="button" to="/review?mode=mistakes">去复习错题</Link>
          <Link className="button secondary" to={completedMapReturnPath}>回学习地图</Link>
        </div>
      </section>
    );
  }

  if (!exercise) return null;

  return (
    <section className="panel lesson-runner lesson-session">
      <div className="lesson-topbar">
        <button
          className="button ghost lesson-exit-button"
          type="button"
          onClick={() => void exitAndSave()}
          disabled={saving}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          {saving ? "正在保存" : "退出并保存"}
        </button>
        <div className="lesson-meta">
          <span className="badge">{lesson.level}</span>
          <span>第 {step + 1} 题，共 {lesson.exercises.length} 题</span>
          {saving && <span className="saving-indicator"><LoaderCircle size={16} aria-hidden="true" />正在保存</span>}
        </div>
      </div>
      <div className="progress" aria-label={`课程进度 ${progress}%`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <ExerciseRenderer exercise={exercise} savedAnswer={savedAnswer} onComplete={onResult} />
      {showDailyCheckpoint && (
        <aside className="daily-checkpoint" aria-live="polite">
          <div>
            <span className="eyebrow">今日目标已达成</span>
            <h3>已完成 {summary.answered} 项，达到你的 {preferences?.dailyMinutes ?? 10} 分钟计划。</h3>
            <p>现在收工也会保存进度；有状态时可以继续完成整节课。</p>
          </div>
          <button className="button" type="button" onClick={() => void finishDailyPlan()} disabled={saving}>完成今日计划</button>
        </aside>
      )}
      <div className="lesson-actions">
        <button className="button secondary skip-action" type="button" onClick={() => void skipCurrent()} disabled={Boolean(savedAnswer) || saving}>
          跳过并查看答案
        </button>
        <div className="next-step-control">
          <span className="next-step-hint" aria-live="polite">
            {canAdvance ? "答案已保存，可以继续。" : "完成当前练习后即可进入下一题。"}
          </span>
          <button className="button next-action" type="button" onClick={() => void next()} disabled={!canAdvance}>
            {saving ? "正在保存" : step + 1 >= lesson.exercises.length ? "完成本课" : "下一题"}
            {!saving && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </section>
  );
}
