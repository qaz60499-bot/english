import { CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { ExerciseRenderer } from "../components/lesson/ExerciseRenderer";
import { SpeechPanel } from "../components/pronunciation/SpeechPanel";
import { content } from "../content/contentIndex";
import { useLearningStore } from "../stores/useLearningStore";
import type { CultureStory, ExerciseResult, Level } from "../types/content";

function StoryPractice({ story }: { story: CultureStory }) {
  const recordResult = useLearningStore((state) => state.recordResult);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [completed, setCompleted] = useState(false);
  const exercise = story.comprehensionExercises[index];

  async function handleResult(result: ExerciseResult) {
    await recordResult(result);
    setDone(true);
  }

  function next() {
    if (!done) return;
    if (index + 1 >= story.comprehensionExercises.length) {
      setCompleted(true);
      return;
    }
    setIndex((value) => value + 1);
    setDone(false);
  }

  if (completed) {
    return (
      <section className="story-quiz" aria-live="polite">
        <div className="feedback-title"><CheckCircle2 size={22} aria-hidden="true" /><strong>故事任务完成</strong></div>
        <p>这篇故事的理解与复述已经计入记忆系统。稍后可在错题复习或到期复习中再次遇到。</p>
        <button className="button secondary" type="button" onClick={() => { setIndex(0); setDone(false); setCompleted(false); }}>重新练习</button>
      </section>
    );
  }

  return (
    <section className="story-quiz">
      <div className="toolbar">
        <span className="badge">故事任务 {index + 1}/{story.comprehensionExercises.length}</span>
        <span>{exercise.skill}</span>
      </div>
      <ExerciseRenderer key={`${story.id}-${exercise.id}-${index}`} exercise={exercise} onComplete={handleResult} />
      <button className="button" type="button" onClick={next} disabled={!done}>
        {index + 1 >= story.comprehensionExercises.length ? "完成故事任务" : "下一项"}
      </button>
    </section>
  );
}

export function StoriesPage() {
  const [openId, setOpenId] = useState(content.cultureStories[0].id);
  const [level, setLevel] = useState<"ALL" | Level>("ALL");
  const [region, setRegion] = useState("ALL");
  const regions = useMemo(() => Array.from(new Set(content.cultureStories.map((story) => story.region))), []);
  const rows = content.cultureStories.filter((story) => (level === "ALL" || story.level === level) && (region === "ALL" || story.region === region));

  return (
    <div className="page">
      <PageHeader eyebrow="文化故事馆" title="读得懂，也能把故事说出来。" description={`共 ${content.cultureStories.length} 篇原创微故事。每篇包含逐段准确翻译、地区提示、理解任务和个人表达任务。`} />
      <section className="panel map-toolbar">
        <label className="field">等级<select value={level} onChange={(event) => setLevel(event.target.value as "ALL" | Level)}><option value="ALL">全部</option><option value="BASIC">基础</option><option value="CET4">四级</option><option value="CET6">六级</option><option value="IELTS">雅思</option><option value="TOEFL">托福</option></select></label>
        <label className="field">地区<select value={region} onChange={(event) => setRegion(event.target.value)}><option value="ALL">全部地区</option>{regions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      </section>
      <div className="grid two">
        {rows.map((story) => (
          <article className="item-card" key={story.id}>
            <span className="badge">{story.region} · {story.level}</span>
            <h2>{story.title}</h2>
            <section className="story-goals">
              <strong>读完能够：</strong>
              <ul>{story.learningGoals.map((goal) => <li key={goal}>{goal}</li>)}</ul>
            </section>
            {story.spanishParagraphs.map((paragraph) => <p className="story-text" lang="en" key={paragraph}>{paragraph}</p>)}
            <SpeechPanel text={story.spanishParagraphs.join(" ")} />
            <button className="button secondary" type="button" onClick={() => setOpenId(openId === story.id ? "" : story.id)}>{openId === story.id ? "收起翻译与任务" : "查看翻译与任务"}</button>
            {openId === story.id && (
              <section className="answer-comparison">
                <div>
                  <span>逐段中文</span>
                  {story.translationZh.map((paragraph, index) => <p key={`${story.id}-translation-${index}`}>{index + 1}. {paragraph}</p>)}
                </div>
                {story.cultureNotes.map((note) => <p key={note.title}><strong>{note.title}：</strong>{note.bodyZh}</p>)}
                <p><strong>个人表达任务：</strong>{story.outputTask.promptZh}</p>
                <p lang="en"><strong>参考：</strong>{story.outputTask.exampleAnswer}</p>
                <StoryPractice story={story} />
              </section>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
