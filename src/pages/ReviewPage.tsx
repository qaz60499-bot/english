import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { ReviewSession } from "../components/review/ReviewSession";
import { getDueRecords, getMistakeRecords, type ReviewMode } from "../engines/reviewEngine";
import { useLearningStore } from "../stores/useLearningStore";

const validModes = new Set<ReviewMode>(["due", "mistakes", "practice"]);

export function ReviewPage() {
  const memory = useLearningStore((state) => state.memory);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMode = searchParams.get("mode") as ReviewMode | null;
  const mode: ReviewMode = requestedMode && validModes.has(requestedMode) ? requestedMode : "due";
  const dueCount = getDueRecords(memory).length;
  const mistakeCount = getMistakeRecords(memory).length;

  function selectMode(nextMode: ReviewMode) {
    setSearchParams(nextMode === "due" ? {} : { mode: nextMode });
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="复习中心"
        title="该复习的、答错的、想多练的，分开处理。"
        description="到期复习只显示真正到期内容；错题重练保留历史薄弱项；自由练习不会伪装成系统任务。"
      />
      <div className="segmented-control" role="tablist" aria-label="复习类型">
        <button type="button" role="tab" aria-selected={mode === "due"} onClick={() => selectMode("due")}>
          今日到期 <span>{dueCount}</span>
        </button>
        <button type="button" role="tab" aria-selected={mode === "mistakes"} onClick={() => selectMode("mistakes")}>
          错题重练 <span>{mistakeCount}</span>
        </button>
        <button type="button" role="tab" aria-selected={mode === "practice"} onClick={() => selectMode("practice")}>
          自由练习
        </button>
      </div>
      <ReviewSession key={mode} mode={mode} />
    </div>
  );
}
