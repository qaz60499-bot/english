import { ArrowRight, CalendarCheck, Headphones, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { SpeechPanel } from "../components/pronunciation/SpeechPanel";
import { contentSummary } from "../content/summaryIndex";
import { getDailyExerciseTarget, getNextLessonForLevel, getRecentProgressForLevel } from "../engines/learningPlan";
import { getDueRecords, getMistakeRecords } from "../engines/reviewEngine";
import { useLearningStore } from "../stores/useLearningStore";

function isToday(value?: string) {
  if (!value) return false;
  return new Date(value).toDateString() === new Date().toDateString();
}

export function TodayPage() {
  const preferences = useLearningStore((state) => state.preferences);
  const memory = useLearningStore((state) => state.memory);
  const progress = useLearningStore((state) => state.progress);
  const activities = useLearningStore((state) => state.activities);
  const preferredLevel = preferences?.level ?? "BASIC";
  const recentInProgress = getRecentProgressForLevel(progress, contentSummary.courses, preferredLevel);
  const hasCompletedSessionForRecent = recentInProgress
    ? activities.some((item) => item.type === "session" && item.referenceId === recentInProgress.lessonId && isToday(item.completedAt))
    : false;
  const inProgress = hasCompletedSessionForRecent ? undefined : recentInProgress;
  const due = getDueRecords(memory);
  const mistakes = getMistakeRecords(memory);
  const completedToday = progress.some((item) => item.completed && isToday(item.updatedAt)) || activities.some((item) => isToday(item.completedAt));
  const reviewsToday = activities.filter((item) => item.type === "review" && isToday(item.completedAt));
  const lastUpdated = [...progress.map((item) => item.updatedAt), ...activities.map((item) => item.completedAt)].sort().at(-1);
  const daysAway = lastUpdated ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 86400000) : 0;
  const nextLesson = getNextLessonForLevel(contentSummary.courses, progress, preferredLevel);
  const inProgressLesson = inProgress ? contentSummary.courses.find((lesson) => lesson.id === inProgress.lessonId) : undefined;
  const answeredCount = inProgress ? Object.keys(inProgress.answers ?? {}).length : 0;
  const remainingMinutes = inProgressLesson
    ? Math.max(1, Math.ceil(inProgressLesson.minutes * (1 - answeredCount / Math.max(inProgressLesson.exerciseCount, 1))))
    : 0;
  const dailyTarget = nextLesson ? getDailyExerciseTarget(nextLesson.exerciseCount, nextLesson.minutes, preferences) : 0;
  const mainTask = inProgress
    ? {
        eyebrow: "继续学习",
        title: `继续：${inProgressLesson?.title ?? "上次课程"}`,
        description: `已完成 ${answeredCount}/${inProgressLesson?.exerciseCount ?? "?"} 项，预计还剩约 ${remainingMinutes} 分钟。`,
        cta: "继续课程",
        to: `/lesson/${inProgress.lessonId}`
      }
    : due.length > 0
      ? {
          eyebrow: "到期复习",
          title: `先完成 ${Math.min(due.length, 8)} 项复习`,
          description: "先稳住快要忘记的内容，再决定是否学习新课。",
          cta: "开始复习",
          to: "/review"
        }
      : completedToday
        ? {
            eyebrow: "今日完成",
            title: reviewsToday.length > 0 ? "今天的复习已经完成" : "今天完成了，再来一个轻挑战",
            description: reviewsToday.length > 0 ? `已完成 ${reviewsToday.reduce((sum, item) => sum + item.itemCount, 0)} 个复习项目。` : "可选任务，不强迫；也可以直接结束今天的学习。",
            cta: "打开发现",
            to: "/discover"
          }
        : daysAway >= 3
          ? {
              eyebrow: "轻松回来",
              title: "5分钟恢复任务",
              description: "进度不会清零，从熟悉内容重新进入英语状态。",
              cta: "开始恢复",
              to: "/review?mode=practice"
            }
          : {
              eyebrow: progress.length === 0 ? "3分钟首次体验" : "下一课",
              title: progress.length === 0 ? "今天只需学会一个句子" : `继续路线：${nextLesson.title}`,
              description: progress.length === 0 ? `从 ${preferredLevel} 路线开始，今天安排 ${dailyTarget} 项，约 ${preferences?.dailyMinutes ?? 10} 分钟。` : `${nextLesson.realGoal} 今天先完成 ${dailyTarget}/${nextLesson.exerciseCount} 项。`,
              cta: progress.length === 0 ? `开始 ${preferredLevel} 路线` : "开始下一课",
              to: `/lesson/${nextLesson.id}`
            };

  const todayLabel = new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", weekday: "short" }).format(new Date());

  return (
    <div className="page today-page">
      <section className="today-command">
        <div className="command-copy">
          <div className="command-kicker">
            <span>DAILY BRIEF</span>
            <time>{todayLabel}</time>
          </div>
          <span className="eyebrow">{mainTask.eyebrow}</span>
          <h1>{mainTask.title}</h1>
          <p>{mainTask.description}</p>
          <div className="toolbar">
            <Link className="button" to={mainTask.to}>
              {mainTask.cta}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="button secondary" to="/onboarding">调整目标</Link>
          </div>
        </div>
        <aside className="language-console" aria-label="当前学习概览">
          <div className="console-topline">
            <span>ENGLISH MODE</span>
            <span className="console-status">ACTIVE</span>
          </div>
          <strong className="language-code">EN</strong>
          <div className="sound-bars" aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => <span key={index} />)}
          </div>
          <dl>
            <div><dt>LEVEL</dt><dd>{preferredLevel}</dd></div>
            <div><dt>FOCUS</dt><dd>{preferences?.dailyMinutes ?? 10} MIN</dd></div>
            <div><dt>QUEUE</dt><dd>{due.length} REVIEW</dd></div>
          </dl>
        </aside>
      </section>

      <section className="metric-strip" aria-label="学习数据概览">
        <article className="metric-card">
          <Sparkles size={20} aria-hidden="true" />
          <div><strong>{progress.filter((item) => item.completed).length}</strong><span>已完成课程</span></div>
          <small>总路线 {contentSummary.stats.courses} 节</small>
        </article>
        <article className="metric-card">
          <Headphones size={20} aria-hidden="true" />
          <div><strong>{due.length}</strong><span>今日到期</span></div>
          <small>{mistakes.length} 个历史错题</small>
        </article>
        <article className="metric-card">
          <CalendarCheck size={20} aria-hidden="true" />
          <div><strong>{preferences?.dailyMinutes ?? 10}</strong><span>分钟目标</span></div>
          <small>完成一项主任务即可</small>
        </article>
      </section>

      <section className="phrase-console">
        <div className="phrase-index" aria-hidden="true">01</div>
        <div className="phrase-copy">
          <span className="console-label">TODAY'S LINE</span>
          <h2 lang="en">Hello, I am learning English step by step.</h2>
          <p>先听清节奏，再完整跟读一次。不要追求快，先追求稳定。</p>
        </div>
        <SpeechPanel text="Hello, I am learning English step by step." />
      </section>
    </div>
  );
}
