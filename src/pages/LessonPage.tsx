import { Navigate, useParams } from "react-router-dom";
import { BookOpenCheck, Lightbulb, MessageCircleMore, TriangleAlert } from "lucide-react";
import { LessonRunner } from "../components/lesson/LessonRunner";
import { content } from "../content/contentIndex";
import { PageHeader } from "../components/common/PageHeader";
import { SpeechPanel } from "../components/pronunciation/SpeechPanel";

export function LessonPage() {
  const { lessonId } = useParams();
  const lesson = content.courses.find((item) => item.id === lessonId);
  if (!lesson) return <Navigate to="/map" replace />;

  return (
    <div className="page">
      <PageHeader eyebrow={`${lesson.level} · ${lesson.minutes} 分钟`} title={lesson.title} description={lesson.realGoal} />
      <section className="lesson-brief panel" aria-label="本课学习预览">
        <div className="lesson-brief-heading">
          <div>
            <span className="eyebrow">先看懂，再开始</span>
            <h2>这节课会在真实情境中完成什么</h2>
          </div>
          <span className="badge">{lesson.exercises.length} 项训练</span>
        </div>
        <div className="grid two lesson-brief-grid">
          <div className="brief-block">
            <Lightbulb size={20} aria-hidden="true" />
            <div><h3>核心抓手</h3><ul>{(lesson.keyPoints ?? []).map((item) => <li key={item}>{item}</li>)}</ul></div>
          </div>
          <div className="brief-block">
            <TriangleAlert size={20} aria-hidden="true" />
            <div><h3>容易踩坑</h3><ul>{(lesson.commonPitfalls ?? []).map((item) => <li key={item}>{item}</li>)}</ul></div>
          </div>
        </div>
        <details className="lesson-dialogue">
          <summary><MessageCircleMore size={18} aria-hidden="true" />先听本课迷你对话</summary>
          <div className="dialogue-lines">
            {lesson.dialogue.map((line, index) => (
              <div key={`${line.spanish}-${index}`}>
                <p lang="en">{line.spanish}</p>
                <span>{line.zh}</span>
              </div>
            ))}
          </div>
          <SpeechPanel text={lesson.dialogue.map((line) => line.spanish).join(" ")} />
        </details>
        {lesson.completionChallenge && (
          <p className="completion-challenge"><BookOpenCheck size={19} aria-hidden="true" /><span><strong>完成挑战：</strong>{lesson.completionChallenge}</span></p>
        )}
      </section>
      <LessonRunner lesson={lesson} />
    </div>
  );
}
