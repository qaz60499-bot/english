import { useMemo, useState } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { SpeechPanel } from "../components/pronunciation/SpeechPanel";
import { content } from "../content/contentIndex";
import type { Level } from "../types/content";

export function PronunciationPage() {
  const [level, setLevel] = useState<"ALL" | Level>("ALL");
  const rows = useMemo(() => content.pronunciation.filter((topic) => level === "ALL" || topic.level === level), [level]);
  return (
    <div className="page">
      <PageHeader eyebrow="发音实验室" title="不是只听一遍，而是完成一次发音训练。" description={`共 ${content.pronunciation.length} 个专题，覆盖元音、辅音、r/rr、重音、双元音、连读、节奏、语调和地区口音适应。`} />
      <section className="panel map-toolbar"><label className="field">等级<select value={level} onChange={(event) => setLevel(event.target.value as "ALL" | Level)}><option value="ALL">全部</option><option value="BASIC">基础</option><option value="CET4">四级</option><option value="CET6">六级</option><option value="IELTS">雅思</option><option value="TOEFL">托福</option></select></label></section>
      <div className="grid two">
        {rows.map((topic) => (
          <article className="item-card" key={topic.id}>
            <span className="badge">{topic.level}</span>
            <h2>{topic.title}</h2>
            <p>{topic.explanationZh}</p>
            <div className="pronunciation-focus"><strong>训练重点</strong><span>{topic.focus}</span></div>
            <ol className="practice-steps"><li>先看发音规则和口型提示</li><li>慢速听一遍，再跟读一遍</li><li>录音回听，对照最小对立或节奏</li></ol>
            <p><strong>示例：</strong><span lang="en">{topic.examples.join("、")}</span></p>
            {topic.minimalPairs.length > 0 && <p><strong>对比：</strong><span lang="en">{topic.minimalPairs.join("；")}</span></p>}
            <SpeechPanel text={topic.examples.join(". ")} />
            <details><summary>完成自检</summary><ol>{topic.selfCheck.map((item) => <li key={item}>{item}</li>)}</ol></details>
          </article>
        ))}
      </div>
    </div>
  );
}
