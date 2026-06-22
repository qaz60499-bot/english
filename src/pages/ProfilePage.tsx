import { Download, Settings, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { clearLearningData, exportLearningData, importLearningData } from "../services/storage";
import { useLearningStore } from "../stores/useLearningStore";

export function ProfilePage() {
  const memory = useLearningStore((state) => state.memory);
  const progress = useLearningStore((state) => state.progress);
  const activities = useLearningStore((state) => state.activities);
  const init = useLearningStore((state) => state.init);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function download() {
    const data = await exportLearningData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `英语星球-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setIsError(false);
    setMessage("学习数据已导出。");
  }

  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setIsError(true);
      setMessage("文件超过10MB，请确认这是本网站导出的JSON学习数据。");
      return;
    }
    try {
      const raw = await file.text();
      const parsed: unknown = JSON.parse(raw);
      await importLearningData(parsed);
      await init();
      setIsError(false);
      setMessage("导入成功，课程进度、复习记录和设置已恢复。");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? `导入失败：${error.message}` : "导入失败：文件格式无效。");
    }
  }

  async function clear() {
    if (!window.confirm("确认清空本地学习数据？清空后会重新进入首次引导。")) return;
    await clearLearningData();
    await init();
    setIsError(false);
    setMessage("本地学习数据已清空。");
  }

  return (
    <div className="page">
      <PageHeader eyebrow="语言档案" title="你的数据只在本地。" description="无需登录即可学习；录音默认只留在当前会话，导出导入由你主动触发。" />
      <div className="grid three">
        <section className="panel"><h2>{memory.length}</h2><p>记忆记录</p></section>
        <section className="panel"><h2>{progress.filter((item) => item.completed).length}</h2><p>已完成课程</p></section>
        <section className="panel"><h2>{activities.filter((item) => item.type === "review").length}</h2><p>完成复习轮次</p></section>
      </div>
      <section className="panel" style={{ marginTop: "1rem" }}>
        <div className="toolbar">
          <Link className="button secondary" to="/settings"><Settings size={18} aria-hidden="true" />学习与外观设置</Link>
          <button className="button" type="button" onClick={() => void download()}><Download size={18} aria-hidden="true" />导出数据</button>
          <label className="button secondary">
            <Upload size={18} aria-hidden="true" />导入数据
            <input type="file" accept="application/json,.json" hidden onChange={(event) => void upload(event.target.files?.[0])} />
          </label>
          <button className="button secondary" type="button" onClick={() => void clear()}><Trash2 size={18} aria-hidden="true" />清空本地数据</button>
        </div>
        {message && <p className={`status-message ${isError ? "is-error" : "is-success"}`} role="status">{message}</p>}
      </section>
    </div>
  );
}
