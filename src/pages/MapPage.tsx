import { ArrowRight, Check, CircleDot } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { contentSummary } from "../content/summaryIndex";
import { useLearningStore } from "../stores/useLearningStore";
import type { Level } from "../types/content";

type MapLevel = "ALL" | Level;
type MapStatus = "ALL" | "todo" | "doing" | "done";

const mapLevels: MapLevel[] = ["ALL", "BASIC", "CET4", "CET6", "IELTS", "TOEFL"];
const mapStatuses: MapStatus[] = ["ALL", "todo", "doing", "done"];

function isMapLevel(value: string | null): value is MapLevel {
  return Boolean(value && mapLevels.includes(value as MapLevel));
}

function isMapStatus(value: string | null): value is MapStatus {
  return Boolean(value && mapStatuses.includes(value as MapStatus));
}

function buildChapters() {
  const chapters: { title: string; lessons: typeof contentSummary.courses }[] = [];
  for (const lesson of contentSummary.courses) {
    const current = chapters.at(-1);
    if (!current || current.title !== lesson.unit) {
      chapters.push({ title: lesson.unit, lessons: [lesson] });
    } else {
      current.lessons.push(lesson);
    }
  }
  return chapters.map((chapter, index) => ({ ...chapter, index: index + 1 }));
}

export function MapPage() {
  const progress = useLearningStore((state) => state.progress);
  const preferences = useLearningStore((state) => state.preferences);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedLevel = searchParams.get("level");
  const requestedStatus = searchParams.get("status");
  const requestedChapter = searchParams.get("chapter") ?? "";
  const level: MapLevel = isMapLevel(requestedLevel) ? requestedLevel : preferences?.level ?? "ALL";
  const status: MapStatus = isMapStatus(requestedStatus) ? requestedStatus : "ALL";
  const chapters = useMemo(() => buildChapters(), []);
  const completed = useMemo(() => new Set(progress.filter((item) => item.completed).map((item) => item.lessonId)), [progress]);
  const inProgress = useMemo(() => new Set(progress.filter((item) => !item.completed).map((item) => item.lessonId)), [progress]);
  const progressByLesson = useMemo(() => new Map(progress.map((item) => [item.lessonId, item])), [progress]);

  const filteredChapters = useMemo(
    () => chapters
      .map((chapter) => ({
        ...chapter,
        lessons: chapter.lessons.filter((lesson) => {
          const levelMatch = level === "ALL" || lesson.level === level;
          const statusMatch =
            status === "ALL" ||
            (status === "done" && completed.has(lesson.id)) ||
            (status === "doing" && inProgress.has(lesson.id)) ||
            (status === "todo" && !completed.has(lesson.id) && !inProgress.has(lesson.id));
          return levelMatch && statusMatch;
        })
      }))
      .filter((chapter) => chapter.lessons.length > 0),
    [chapters, completed, inProgress, level, status]
  );

  const activeChapter = filteredChapters.find((chapter) => chapter.title === requestedChapter) ?? filteredChapters[0];

  function updateMapParams(updates: { level?: MapLevel; status?: MapStatus; chapter?: string }, resetChapter = false) {
    const next = new URLSearchParams(searchParams);
    if (updates.level) next.set("level", updates.level);
    if (updates.status) next.set("status", updates.status);
    if (resetChapter) next.delete("chapter");
    if (updates.chapter) next.set("chapter", updates.chapter);
    setSearchParams(next, { replace: true });
  }
  const visibleLessons = filteredChapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0);
  const visibleCompleted = filteredChapters.reduce(
    (sum, chapter) => sum + chapter.lessons.filter((lesson) => completed.has(lesson.id)).length,
    0
  );

  return (
    <div className="page route-page">
      <header className="route-header">
        <PageHeader
          eyebrow="ROUTE DESK"
          title="把英语拆成一条条可以完成的路线。"
          description="左侧选择训练阶段，右侧只显示当前章节。路线、进度和下一步集中在同一个工作区。"
        />
        <div className="route-summary" aria-label="路线概览">
          <span><strong>{visibleLessons}</strong> 当前课程</span>
          <span><strong>{visibleCompleted}</strong> 已完成</span>
          <span><strong>{filteredChapters.length}</strong> 可见章节</span>
        </div>
      </header>

      <section className="route-controls" aria-label="课程筛选">
        <label className="field">
          学习等级
          <select value={level} onChange={(event) => updateMapParams({ level: event.target.value as MapLevel }, true)}>
            <option value="ALL">全部等级</option>
            <option value="BASIC">基础</option>
            <option value="CET4">四级</option>
            <option value="CET6">六级</option>
            <option value="IELTS">雅思</option>
            <option value="TOEFL">托福</option>
          </select>
        </label>
        <label className="field">
          学习状态
          <select value={status} onChange={(event) => updateMapParams({ status: event.target.value as MapStatus }, true)}>
            <option value="ALL">全部状态</option>
            <option value="todo">未开始</option>
            <option value="doing">进行中</option>
            <option value="done">已完成</option>
          </select>
        </label>
      </section>

      {activeChapter ? (
        <section className="route-workspace">
          <aside className="route-rail" aria-label="章节列表">
            <div className="rail-heading">
              <span>CURRICULUM</span>
              <strong>{String(filteredChapters.length).padStart(2, "0")}</strong>
            </div>
            <div className="route-list">
              {filteredChapters.map((chapter) => {
                const done = chapter.lessons.filter((lesson) => completed.has(lesson.id)).length;
                const active = chapter.title === activeChapter.title;
                return (
                  <button
                    className={`route-tab ${active ? "is-active" : ""}`}
                    type="button"
                    key={chapter.title}
                    aria-pressed={active}
                    onClick={() => updateMapParams({ chapter: chapter.title })}
                  >
                    <span className="route-number">{String(chapter.index).padStart(2, "0")}</span>
                    <span className="route-tab-copy">
                      <span role="heading" aria-level={2}>{chapter.title}</span>
                      <small>{chapter.lessons.length} 节 · {done} 完成</small>
                    </span>
                    {done === chapter.lessons.length ? <Check size={17} aria-label="章节已完成" /> : <CircleDot size={17} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="route-stage">
            <div className="stage-heading">
              <div>
                <span className="stage-code">UNIT {String(activeChapter.index).padStart(2, "0")}</span>
                <h2>{activeChapter.title}</h2>
              </div>
              <span>{activeChapter.lessons.length} LESSONS</span>
            </div>

            <div className="lesson-track">
              {activeChapter.lessons.map((lesson, lessonIndex) => {
                const saved = progressByLesson.get(lesson.id);
                const answered = Object.keys(saved?.answers ?? {}).length;
                const percentage = completed.has(lesson.id)
                  ? 100
                  : saved
                    ? Math.max(4, Math.min(96, Math.round((answered / Math.max(lesson.exerciseCount, 1)) * 100)))
                    : 0;
                const state = completed.has(lesson.id) ? "done" : inProgress.has(lesson.id) ? "doing" : "todo";
                return (
                  <article className={`track-card is-${state}`} key={lesson.id}>
                    <div className="track-index">
                      <span>{String(lessonIndex + 1).padStart(2, "0")}</span>
                      <i aria-hidden="true" />
                    </div>
                    <div className="track-copy">
                      <div className="track-topline">
                        <span className="badge">{lesson.level}</span>
                        <span>{lesson.minutes} MIN · {lesson.exerciseCount} TASKS</span>
                      </div>
                      <h3>{lesson.title}</h3>
                      <p>{lesson.realGoal}</p>
                      <div className="track-progress">
                        <div className="progress" aria-label={`${lesson.title} 学习进度`}>
                          <span style={{ width: `${percentage}%` }} />
                        </div>
                        <strong>{percentage}%</strong>
                      </div>
                    </div>
                    <Link
                      className="track-entry"
                      to={`/lesson/${lesson.id}?${new URLSearchParams({
                        mapLevel: level,
                        mapStatus: status,
                        mapChapter: activeChapter.title
                      }).toString()}`}
                      aria-label={`${completed.has(lesson.id) ? "复习" : inProgress.has(lesson.id) ? "继续" : "开始"}${lesson.title}`}
                    >
                      <span>{completed.has(lesson.id) ? "复习" : inProgress.has(lesson.id) ? "继续" : "开始"}</span>
                      <ArrowRight size={19} aria-hidden="true" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        <section className="panel empty-state" role="status">
          <h2>没有符合筛选条件的路线</h2>
          <p>调整等级或学习状态后，路线工作区会重新生成。</p>
        </section>
      )}
    </div>
  );
}
