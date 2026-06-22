import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLearningStore } from "../stores/useLearningStore";
import type { UserPreferences } from "../types/content";

export function OnboardingPage() {
  const navigate = useNavigate();
  const current = useLearningStore((state) => state.preferences);
  const setPreferences = useLearningStore((state) => state.setPreferences);
  const [form, setForm] = useState<UserPreferences>(
    current ?? {
      goal: "每天用 10 分钟听懂并说出真实英语句子",
      level: "BASIC",
      dailyMinutes: 10,
      accent: "auto",
      energy: "steady",
      theme: "system",
      reduceMotion: false
    }
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await setPreferences(form);
    navigate("/");
  }

  return (
    <main className="page" style={{ padding: "2rem 1rem" }}>
      <section className="panel">
        <span className="eyebrow">首次引导</span>
        <h1>今天不用证明自己很厉害。</h1>
        <p>选择起点、每日时长和状态，Lumi 会安排对应等级与今天的题量。</p>
        <form className="grid two" onSubmit={submit}>
          <label className="field">
            学习目标
            <input value={form.goal} onChange={(event) => setForm({ ...form, goal: event.target.value })} />
          </label>
          <label className="field">
            当前水平
            <select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value as UserPreferences["level"] })}>
              <option value="BASIC">基础</option>
              <option value="CET4">四级</option>
              <option value="CET6">六级</option>
              <option value="IELTS">雅思</option>
              <option value="TOEFL">托福</option>
            </select>
          </label>
          <label className="field">
            每日时长
            <input type="number" min="5" max="40" value={form.dailyMinutes} onChange={(event) => setForm({ ...form, dailyMinutes: Number(event.target.value) })} />
          </label>
          <label className="field">
            口音偏好
            <select value={form.accent} onChange={(event) => setForm({ ...form, accent: event.target.value as UserPreferences["accent"] })}>
              <option value="auto">自动</option>
              <option value="en-US">美式英语</option>
              <option value="en-GB">英式英语</option>
            </select>
          </label>
          <label className="field">
            今天状态
            <select value={form.energy} onChange={(event) => setForm({ ...form, energy: event.target.value as UserPreferences["energy"] })}>
              <option value="steady">正常学习</option>
              <option value="light">有点累</option>
              <option value="challenge">想挑战</option>
            </select>
          </label>
          <label className="field">
            主题
            <select value={form.theme} onChange={(event) => setForm({ ...form, theme: event.target.value as UserPreferences["theme"] })}>
              <option value="system">跟随系统</option>
              <option value="light">明亮</option>
              <option value="dark">深色</option>
            </select>
          </label>
          <label className="toolbar">
            <input type="checkbox" checked={form.reduceMotion} onChange={(event) => setForm({ ...form, reduceMotion: event.target.checked })} />
            减少动画
          </label>
          <button className="button" type="submit">进入英语星球</button>
        </form>
      </section>
    </main>
  );
}
