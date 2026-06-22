import { CheckCircle2, RotateCcw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { content } from "../../content/contentIndex";
import { selectReviewExercises, type ReviewMode } from "../../engines/reviewEngine";
import { useLearningStore } from "../../stores/useLearningStore";
import type { Exercise, ExerciseResult } from "../../types/content";
import { ExerciseRenderer } from "../lesson/ExerciseRenderer";

interface ReviewSessionProps {
  mode: ReviewMode;
}

interface ReviewOutcome {
  exerciseId: string;
  firstTryCorrect: boolean;
  mastered: boolean;
  attempts: number;
}

const modeCopy: Record<ReviewMode, { emptyTitle: string; emptyBody: string; completed: string }> = {
  due: {
    emptyTitle: "今天没有到期复习",
    emptyBody: "说明当前没有必须复习的内容。可以去“错题重练”处理历史薄弱项，或进入“自由练习”。",
    completed: "本轮到期复习完成"
  },
  mistakes: {
    emptyTitle: "目前没有待处理错题",
    emptyBody: "答错并订正的记录会保留在这里，直到掌握度稳定提升。",
    completed: "本轮错题重练完成"
  },
  practice: {
    emptyTitle: "暂时没有可用练习",
    emptyBody: "请先进入学习地图完成一节课程。",
    completed: "本轮自由练习完成"
  }
};

export function ReviewSession({ mode }: ReviewSessionProps) {
  const preferences = useLearningStore((state) => state.preferences);
  const memory = useLearningStore((state) => state.memory);
  const recordResult = useLearningStore((state) => state.recordResult);
  const recordActivity = useLearningStore((state) => state.recordActivity);
  const initialQueue = useMemo(() => {
    if (!preferences) return [] as Exercise[];
    return selectReviewExercises(content, memory, preferences, 8, mode);
  }, [memory, mode, preferences]);
  const [queue, setQueue] = useState<Exercise[]>(initialQueue);
  const [index, setIndex] = useState(0);
  const [currentDone, setCurrentDone] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const advancingRef = useRef(false);
  const resultRef = useRef(false);
  const [outcomes, setOutcomes] = useState<Record<string, ReviewOutcome>>({});
  const current = queue[index];
  const finished = index >= queue.length;
  const outcomeRows = Object.values(outcomes);
  const firstTryCorrectCount = outcomeRows.filter((item) => item.firstTryCorrect).length;
  const masteredCount = outcomeRows.filter((item) => item.mastered).length;

  async function handleResult(result: ExerciseResult) {
    if (resultRef.current) return;
    resultRef.current = true;
    try {
      await recordResult(result);
      setOutcomes((items) => {
        const previous = items[result.exerciseId];
        return {
          ...items,
          [result.exerciseId]: previous
            ? { ...previous, mastered: result.correct, attempts: previous.attempts + 1 }
            : { exerciseId: result.exerciseId, firstTryCorrect: result.correct, mastered: result.correct, attempts: 1 }
        };
      });
      if (result.correct) {
        setQueue((items) => items.filter((item, itemIndex) => itemIndex <= index || item.id !== current.id));
      }
      if (!currentDone) {
        setCurrentDone(true);
        if (!result.correct) {
          setQueue((items) => {
            const alreadyQueuedLater = items.some((item, itemIndex) => itemIndex > index && item.id === current.id);
            return alreadyQueuedLater ? items : [...items, current];
          });
        }
      }
    } finally {
      resultRef.current = false;
    }
  }

  async function next() {
    if (advancingRef.current || !currentDone) return;
    advancingRef.current = true;
    setAdvancing(true);
    try {
      if (index + 1 >= queue.length) {
        const rows = Object.values(outcomes);
        await recordActivity({
          type: "review",
          mode,
          itemCount: rows.length,
          correctCount: rows.filter((item) => item.mastered).length,
          completedAt: new Date().toISOString()
        });
      }
      setIndex((value) => value + 1);
      setCurrentDone(false);
      resultRef.current = false;
    } finally {
      advancingRef.current = false;
      setAdvancing(false);
    }
  }

  function restart() {
    setQueue(initialQueue);
    setIndex(0);
    setCurrentDone(false);
    setOutcomes({});
    resultRef.current = false;
    advancingRef.current = false;
    setAdvancing(false);
  }

  if (queue.length === 0) {
    return (
      <section className="panel empty-state">
        <h2>{modeCopy[mode].emptyTitle}</h2>
        <p>{modeCopy[mode].emptyBody}</p>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="panel lesson-runner">
        <CheckCircle2 size={42} aria-hidden="true" />
        <h2>{modeCopy[mode].completed}</h2>
        <div className="completion-stats" aria-label="本轮复习成绩">
          <div><strong>{firstTryCorrectCount}</strong><span>首次答对</span></div>
          <div><strong>{masteredCount}</strong><span>最终掌握</span></div>
          <div><strong>{outcomeRows.length - masteredCount}</strong><span>仍待巩固</span></div>
          <div><strong>{outcomeRows.reduce((sum, item) => sum + item.attempts, 0)}</strong><span>总作答次数</span></div>
        </div>
        <p>首次正确率与订正后掌握度分开统计，答错后订正不会被算成“首次答对”。</p>
        <button className="button secondary" type="button" onClick={restart}>
          <RotateCcw size={18} aria-hidden="true" />
          再来一轮
        </button>
      </section>
    );
  }

  return (
    <section className="panel lesson-runner">
      <div className="toolbar">
        <span className="badge">{index + 1} / {queue.length}</span>
        <span>约 {Math.max(1, Math.ceil((queue.length - index) * 0.5))} 分钟</span>
      </div>
      <ExerciseRenderer key={`${current.id}-${index}`} exercise={current} onComplete={handleResult} />
      <button className="button" type="button" onClick={() => void next()} disabled={!currentDone || advancing}>
        {advancing ? "正在保存" : index + 1 >= queue.length ? "完成复习" : "下一项"}
      </button>
    </section>
  );
}
