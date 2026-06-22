import { BookOpen, FileText, Library, Mic } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { contentSummary } from "../content/summaryIndex";

const entries = [
  { to: "/library", title: "词汇与表达库", description: "高频词、理解词、核心句型、场景表达、发音和例句。", count: `${contentSummary.stats.activeVocabulary + contentSummary.stats.recognitionVocabulary} 词块`, icon: Library },
  { to: "/grammar", title: "语法工作室", description: "从真实例句理解结构，再通过常错和微练习巩固。", count: `${contentSummary.stats.grammar} 专题`, icon: BookOpen },
  { to: "/stories", title: "文化故事馆", description: "双语微故事、地区提示、理解题和个人表达任务。", count: `${contentSummary.stats.cultureStories} 故事`, icon: FileText },
  { to: "/pronunciation", title: "发音实验室", description: "元音、辅音、重音、连读、节奏、语调与口音适应。", count: `${contentSummary.stats.pronunciation} 专题`, icon: Mic }
];

export function DiscoverPage() {
  return (
    <div className="page">
      <PageHeader eyebrow="发现" title="不只跟课，也能按自己的问题探索。" description="所有内容均可搜索或筛选，手机端两步内到达；课程、复习与资料库共用同一套知识内容。" />
      <div className="grid two">
        {entries.map((entry) => (
          <Link className="item-card discover-card" to={entry.to} key={entry.title}>
            <entry.icon size={24} aria-hidden="true" />
            <span className="badge">{entry.count}</span>
            <h2>{entry.title}</h2>
            <p>{entry.description}</p>
          </Link>
        ))}
      </div>
      <section className="panel" style={{ marginTop: "1rem" }}>
        <h2>完整学习内容</h2>
        <p>{contentSummary.stats.courses} 节场景课程、{contentSummary.stats.exercises} 道不重复练习、{contentSummary.stats.sentencePatterns} 个核心句型和 {contentSummary.stats.sceneExpressions} 条场景表达。数量按真实去重结果统计，不使用编号或改标签凑量。</p>
      </section>
    </div>
  );
}
