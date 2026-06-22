import { PageHeader } from "../components/common/PageHeader";
import { useLearningStore } from "../stores/useLearningStore";
import type { UserPreferences } from "../types/content";

export function SettingsPage() {
  const preferences = useLearningStore((state) => state.preferences);
  const setPreferences = useLearningStore((state) => state.setPreferences);
  if (!preferences) return null;
  const update = (patch: Partial<UserPreferences>) => void setPreferences(patch);

  return (
    <div className="page">
      <PageHeader eyebrow="设置与隐私" title="学习路线、每日时长、口音和外观都由你控制。" description="修改后会立即用于首页推荐、自由练习和课程中的今日目标，不会清空原有进度。" />
      <section className="panel grid two">
        <label className="field">
          当前学习等级
          <select value={preferences.level} onChange={(event) => update({ level: event.target.value as UserPreferences["level"] })}>
            <option value="BASIC">基础</option><option value="CET4">四级</option><option value="CET6">六级</option><option value="IELTS">雅思</option><option value="TOEFL">托福</option>
          </select>
        </label>
        <label className="field">
          每日学习时长
          <input type="number" min="5" max="40" value={preferences.dailyMinutes} onChange={(event) => update({ dailyMinutes: Math.max(5, Math.min(40, Number(event.target.value) || 5)) })} />
        </label>
        <label className="field">
          今日状态
          <select value={preferences.energy} onChange={(event) => update({ energy: event.target.value as UserPreferences["energy"] })}>
            <option value="light">轻量学习</option><option value="steady">正常学习</option><option value="challenge">想挑战</option>
          </select>
        </label>
        <label className="field">
          学习目标
          <input value={preferences.goal} maxLength={240} onChange={(event) => update({ goal: event.target.value })} />
        </label>
        <label className="field">
          主题
          <select value={preferences.theme} onChange={(event) => update({ theme: event.target.value as UserPreferences["theme"] })}>
            <option value="system">跟随系统</option>
            <option value="light">明亮</option>
            <option value="dark">深色</option>
          </select>
        </label>
        <label className="field">
          口音
          <select value={preferences.accent} onChange={(event) => update({ accent: event.target.value as UserPreferences["accent"] })}>
            <option value="auto">自动</option>
            <option value="en-US">美式英语</option>
            <option value="en-GB">英式英语</option>
          </select>
        </label>
        <label className="toolbar">
          <input type="checkbox" checked={preferences.reduceMotion} onChange={(event) => update({ reduceMotion: event.target.checked })} />
          减少动画
        </label>
      </section>
    </div>
  );
}
