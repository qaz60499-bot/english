import { useMemo, useState } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { content } from "../content/contentIndex";
import type { Level } from "../types/content";

export function GrammarPage() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"ALL" | Level>("ALL");
  const [limit, setLimit] = useState(24);
  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("en");
    return content.grammar.filter((point) =>
      (level === "ALL" || point.level === level) &&
      (!q || point.title.toLocaleLowerCase("en").includes(q) || point.oneLineZh.includes(q) || point.formula.toLocaleLowerCase("en").includes(q))
    );
  }, [query, level]);

  return (
    <div className="page">
      <PageHeader eyebrow="语法工作室" title="先会表达，再理解规则。" description={`共 ${content.grammar.length} 个独立语法点，每项都有能力目标、公式、真实例句、常见错误和微练习。`} />
      <section className="panel map-toolbar">
        <label className="field">搜索<input className="search-input" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(24); }} placeholder="搜索 tense、question、relative clause…" /></label>
        <label className="field">等级<select value={level} onChange={(event) => { setLevel(event.target.value as "ALL" | Level); setLimit(24); }}><option value="ALL">全部</option><option value="BASIC">基础</option><option value="CET4">四级</option><option value="CET6">六级</option><option value="IELTS">雅思</option><option value="TOEFL">托福</option></select></label>
      </section>
      <div className="grid two">
        {rows.slice(0, limit).map((point) => (
          <article className="item-card" key={point.id}>
            <span className="badge">{point.level}</span>
            <h2>{point.title}</h2>
            <p>{point.oneLineZh}</p>
            <p><strong>结构：</strong><span lang="en">{point.formula}</span></p>
            <details open><summary>真实例句</summary><div className="example-stack">{point.examples.map((example) => <p key={`${example.spanish}-${example.zh}`}><span lang="en">{example.spanish}</span><span>{example.zh}</span></p>)}</div></details>
            <details><summary>常见错误与修正</summary><div className="error-stack">{point.commonErrors.map((error) => <div key={`${error.wrong}-${error.fix}`}><p><span lang="en">{error.wrong}</span> → <strong lang="en">{error.fix}</strong></p><small>{error.reasonZh}</small></div>)}</div></details>
            <details><summary>{point.microExercises.length} 个微练习</summary><ol>{point.microExercises.map((task) => <li key={task}>{task}</li>)}</ol></details>
          </article>
        ))}
      </div>
      {limit < rows.length && <button className="button secondary" type="button" onClick={() => setLimit((value) => value + 24)}>显示更多语法</button>}
    </div>
  );
}
