import { PageHeader } from "../components/common/PageHeader";
import { content, contentStats } from "../content/contentIndex";

export function ContentQAPage() {
  const exerciseTypes = new Set(content.courses.flatMap((lesson) => lesson.exercises.map((exercise) => exercise.type)));
  return (
    <div className="page">
      <PageHeader eyebrow="开发环境 Content QA" title="内容数量、题型和缺失字段快速抽查。" />
      <div className="grid three">
        {Object.entries(contentStats).map(([key, value]) => (
          <section className="panel" key={key}><h2>{value}</h2><p>{key}</p></section>
        ))}
      </div>
      <section className="panel" style={{ marginTop: "1rem" }}>
        <h2>题型覆盖</h2>
        <p>{Array.from(exerciseTypes).join(", ")}</p>
      </section>
    </div>
  );
}
