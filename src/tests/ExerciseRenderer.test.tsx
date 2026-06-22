import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExerciseRenderer } from "../components/lesson/ExerciseRenderer";
import type { Exercise } from "../types/content";

const exercise: Exercise = {
  id: "feedback-test",
  type: "singleChoice",
  prompt: "选择正确问候语",
  options: ["hola", "adiós"],
  answer: "hola",
  skill: "vocabulary",
  knowledgeRefs: ["v-1"],
  feedback: {
    light: "先判断场景是见面还是告别。",
    rule: "再比较两个选项在真实对话中的使用时机。",
    full: "本题分析：题目要求选择见面时使用的问候语，hola 用于打招呼，因此正确答案是 hola。"
  }
};

describe("ExerciseRenderer", () => {
  it("shows the user's answer, correct answer and explanation after a mistake", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ExerciseRenderer exercise={exercise} onComplete={onComplete} />);

    await user.click(screen.getByRole("button", { name: "adiós" }));
    await user.click(screen.getByRole("button", { name: "提交答案" }));

    expect(screen.getByText("这题还没有答对")).toBeInTheDocument();
    expect(screen.getByText("正确答案")).toBeInTheDocument();
    expect(screen.getAllByText("hola").length).toBeGreaterThan(0);
    expect(screen.getByText(/本题分析：.*hola/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /重新作答/ })).toBeEnabled();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe("ExerciseRenderer hint flow", () => {
  it("shows analysis guidance without revealing the expected response", async () => {
    const user = userEvent.setup();
    render(<ExerciseRenderer exercise={exercise} onComplete={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "给我一个提示" }));
    expect(screen.getByText(/分析提示 1/).parentElement).not.toHaveTextContent("hola");

    await user.click(screen.getByRole("button", { name: "再提示一点" }));
    expect(screen.getByText(/分析提示 2/).parentElement).not.toHaveTextContent("hola");
  });
});

describe("ExerciseRenderer correction flow", () => {
  it("records a correction as a second attempt instead of losing it", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ExerciseRenderer exercise={exercise} onComplete={onComplete} />);

    await user.click(screen.getByRole("button", { name: "adiós" }));
    await user.click(screen.getByRole("button", { name: "提交答案" }));
    await user.click(screen.getByRole("button", { name: /重新作答/ }));
    await user.click(screen.getByRole("button", { name: "hola" }));
    await user.click(screen.getByRole("button", { name: "提交订正" }));

    expect(screen.getByText("订正正确")).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(onComplete.mock.calls[0][0].correct).toBe(false);
    expect(onComplete.mock.calls[1][0].correct).toBe(true);
    expect(onComplete.mock.calls[1][0].firstTry).toBe(false);
  });
});
