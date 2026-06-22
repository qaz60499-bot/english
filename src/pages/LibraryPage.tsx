import { useMemo, useState } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { SpeechPanel } from "../components/pronunciation/SpeechPanel";
import { content } from "../content/contentIndex";
import type { Level, SentencePattern, VocabularyItem } from "../types/content";

type Tab = "vocabulary" | "patterns" | "scenes";

function SyllableLine({ item }: { item: VocabularyItem }) {
  if (item.syllables.length === 0) return <span>词组按意义分组练习</span>;
  return (
    <span lang="en">
      {item.syllables.map((syllable, index) => (
        <span key={`${item.id}-${syllable}-${index}`}>
          {index > 0 ? " · " : ""}
          {index === item.stressedSyllable ? <mark>{syllable}</mark> : syllable}
        </span>
      ))}
    </span>
  );
}

function PatternCard({ item }: { item: SentencePattern }) {
  return (
    <article className="item-card">
      <span className="badge">{item.level} · {item.register}</span>
      <h2 lang="en">{item.pattern}</h2>
      <p>{item.meaningZh}</p>
      <p><strong>怎么用：</strong>{item.usageNote}</p>
      {item.slots.length > 0 && (
        <p><strong>可替换内容：</strong>{item.slots.map((slot) => `${slot.name}：${slot.options.join(" / ")}`).join("；")}</p>
      )}
      <div className="pattern-examples">
        {item.examples.map((example, index) => (
          <p key={`${item.id}-example-${index}`}><span lang="en">{example.spanish}</span><br /><span>{example.zh}</span></p>
        ))}
      </div>
      {item.commonErrors.map((error, index) => (
        <p key={`${item.id}-error-${index}`}><strong>常见错误：</strong><span lang="en">{error.wrong}</span> → <span lang="en">{error.fix}</span><br /><span>{error.reasonZh}</span></p>
      ))}
      <SpeechPanel text={item.examples[0]?.spanish ?? item.pattern.replace(/\{[^}]+\}/g, "algo")} />
    </article>
  );
}

export function LibraryPage() {
  const [tab, setTab] = useState<Tab>("vocabulary");
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"ALL" | Level>("ALL");
  const [limit, setLimit] = useState(40);

  const vocabulary = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("en");
    return content.vocabulary.filter((item) =>
      (level === "ALL" || item.level === level) &&
      (!q || item.displayForm.toLocaleLowerCase("en").includes(q) || item.meaningsZh.join("").includes(q) || item.tags.join("").includes(q))
    );
  }, [query, level]);

  const patterns = useMemo(() => {
    const source = tab === "patterns" ? content.sentencePatterns : content.sceneExpressions;
    const q = query.trim().toLocaleLowerCase("en");
    return source.filter((item) =>
      (level === "ALL" || item.level === level) &&
      (!q || item.pattern.toLocaleLowerCase("en").includes(q) || item.meaningZh.includes(q) || item.tags.join("").includes(q))
    );
  }, [tab, query, level]);

  const total = tab === "vocabulary" ? vocabulary.length : patterns.length;

  return (
    <div className="page">
      <PageHeader eyebrow="词汇与表达库" title="查得到，也能直接拿来开口。" description="包含高频词、理解词、核心句型和真实场景表达；每一项都有等级、语境、重读音节、发音、搭配和常错提醒。" />
      <section className="panel map-toolbar">
        <div className="toolbar" role="tablist" aria-label="内容类型">
          <button className={`button ${tab === "vocabulary" ? "" : "secondary"}`} type="button" onClick={() => { setTab("vocabulary"); setLimit(40); }}>词汇与词块（{content.vocabulary.length}）</button>
          <button className={`button ${tab === "patterns" ? "" : "secondary"}`} type="button" onClick={() => { setTab("patterns"); setLimit(40); }}>核心句型（{content.sentencePatterns.length}）</button>
          <button className={`button ${tab === "scenes" ? "" : "secondary"}`} type="button" onClick={() => { setTab("scenes"); setLimit(40); }}>场景表达（{content.sceneExpressions.length}）</button>
        </div>
        <label className="field">搜索
          <input className="search-input" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(40); }} placeholder="搜索 café、问路、时间、礼貌请求…" />
        </label>
        <label className="field">等级
          <select value={level} onChange={(event) => { setLevel(event.target.value as "ALL" | Level); setLimit(40); }}>
            <option value="ALL">全部等级</option><option value="BASIC">基础</option><option value="CET4">四级</option><option value="CET6">六级</option><option value="IELTS">雅思</option><option value="TOEFL">托福</option>
          </select>
        </label>
      </section>
      <p className="muted">找到 {total} 项，当前显示 {Math.min(limit, total)} 项。</p>
      <div className="grid two">
        {tab === "vocabulary" ? vocabulary.slice(0, limit).map((item) => (
          <article className="item-card" key={item.id}>
            <span className="badge">{item.level} · {item.partOfSpeech} · {item.active ? "主动掌握" : "理解即可"}</span>
            <h2 lang="en">{item.displayForm}</h2>
            <p>{item.meaningsZh.join("；")}</p>
            <p><strong>音节与重读：</strong><SyllableLine item={item} /></p>
            <ul className="vocabulary-examples">
              {item.examples.map((example, index) => <li key={`${item.id}-example-${index}`}><span lang="en">{example.spanish}</span>｜{example.zh}</li>)}
            </ul>
            {item.collocations.length > 0 && <p><strong>常见搭配：</strong>{item.collocations.join("；")}</p>}
            <SpeechPanel text={item.audioText} />
          </article>
        )) : patterns.slice(0, limit).map((item) => <PatternCard key={item.id} item={item} />)}
      </div>
      {limit < total && <button className="button secondary" type="button" onClick={() => setLimit((value) => value + 40)}>再显示40项</button>}
    </div>
  );
}
