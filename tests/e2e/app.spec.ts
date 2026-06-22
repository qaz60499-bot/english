import { expect, test, type Page } from "@playwright/test";

async function finishOnboarding(page: Page) {
  await page.goto("/");
  const enterButton = page.getByRole("button", { name: "进入英语星球" });
  if (await enterButton.waitFor({ state: "visible", timeout: 5000 }).then(() => true).catch(() => false)) {
    await enterButton.click();
  }
  await expect(page).toHaveURL(/#\/$/);
}

test("new users complete onboarding and start the first lesson", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "今天不用证明自己很厉害。" })).toBeVisible();
  await page.getByRole("button", { name: "进入英语星球" }).click();
  await expect(page.getByRole("heading", { name: /今天只需学会一个句子/ })).toBeVisible();
  await page.getByRole("link", { name: /开始 BASIC 路线/ }).click();
  await expect(page.getByRole("heading", { name: /基础第1轮 · 第1课 · 问候与自我介绍/, level: 1 })).toBeVisible();
  await expect(page.getByText(/第 1 题，共 12 题/)).toBeVisible();
  await expect(page.getByRole("button", { name: /下一题/ })).toBeDisabled();
  await page.getByRole("button", { name: "hello" }).click();
  await page.getByRole("button", { name: "提交答案" }).click();
  await expect(page.getByRole("button", { name: /下一题/ })).toBeEnabled();
});

test("mobile navigation reaches separated review and content libraries", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await finishOnboarding(page);
  await page.getByRole("link", { name: /复习/ }).click();
  await expect(page.getByRole("heading", { name: /该复习的、答错的、想多练的/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /今日到期/ })).toBeVisible();
  await page.getByRole("link", { name: /发现/ }).click();
  await expect(page.getByRole("heading", { name: /不只跟课/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /词汇与表达库/ })).toBeVisible();
});

test("mobile pronunciation playback uses the current topic text", async ({ page }) => {
  await page.addInitScript(() => {
    class MockSpeechSynthesisUtterance {
      text: string;
      lang = "";
      rate = 1;
      voice: SpeechSynthesisVoice | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }

    const voice = { name: "Test English", lang: "en-US" } as SpeechSynthesisVoice;
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: MockSpeechSynthesisUtterance
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        paused: false,
        cancel() {},
        resume() {},
        getVoices: () => [voice],
        speak: (utterance: MockSpeechSynthesisUtterance) => {
          (window as typeof window & { __spokenText?: string }).__spokenText = utterance.text;
        }
      }
    });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await finishOnboarding(page);
  await page.goto("/#/pronunciation");

  const vowelCard = page.locator(".item-card").filter({ hasText: "短元音 /i/ 与长元音 /i:/" }).first();
  await vowelCard.getByRole("button", { name: "播放" }).click();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __spokenText?: string }).__spokenText)).toBe(
    "ship, sheep. live, leave. sit, seat. This ship is cheap."
  );

  const consonantCard = page.locator(".item-card").filter({ hasText: "清辅音与浊辅音" }).first();
  await consonantCard.getByRole("button", { name: "播放" }).click();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __spokenText?: string }).__spokenText)).toBe(
    "pin, bin. fan, van. coat, goat. Please bring the blue bag."
  );
});

test("learning map exposes every route and switches the active route workspace", async ({ page }) => {
  await finishOnboarding(page);
  await page.goto("/#/map");
  await page.getByLabel("学习等级").selectOption("ALL");

  const firstChapter = page.getByRole("button", { name: /基础 · 基础能力起步/ });
  const lastChapter = page.getByRole("button", { name: /托福 · 托福综合输出/ });
  await expect(page.getByRole("heading", { name: /基础 · 基础能力起步/ }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /托福 · 托福综合输出/ }).first()).toBeVisible();
  await expect(firstChapter).toHaveAttribute("aria-pressed", "true");
  await expect(lastChapter).toHaveAttribute("aria-pressed", "false");

  await lastChapter.click();
  await expect(lastChapter).toHaveAttribute("aria-pressed", "true");
  await expect(firstChapter).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".route-stage").getByRole("heading", { name: /托福 · 托福综合输出/ })).toBeVisible();
});

test("save and exit restores every selected learning level", async ({ page }) => {
  await finishOnboarding(page);
  const levels = ["BASIC", "CET4", "CET6", "IELTS", "TOEFL"];

  for (const level of levels) {
    await page.goto("/#/map");
    await page.getByLabel("学习等级").selectOption(level);
    await expect(page.getByLabel("学习等级")).toHaveValue(level);
    await expect(page).toHaveURL(new RegExp(`level=${level}`));

    await page.locator(".track-entry").first().click();
    await expect(page).toHaveURL(new RegExp(`mapLevel=${level}`));
    await page.getByRole("button", { name: "退出并保存" }).click();

    await expect(page.getByLabel("学习等级")).toHaveValue(level);
    await expect(page).toHaveURL(new RegExp(`level=${level}`));
    await expect(page.locator(".track-entry").first()).toContainText("继续");
  }
});

test("save and exit updates incompatible status filters and restores the lesson chapter", async ({ page }) => {
  await finishOnboarding(page);
  await page.goto("/#/map");
  await page.getByLabel("学习等级").selectOption("CET4");
  await page.getByLabel("学习状态").selectOption("todo");
  await page.locator(".track-entry").first().click();
  await expect(page).toHaveURL(/mapStatus=todo/);

  await page.getByRole("button", { name: "退出并保存" }).click();
  await expect(page.getByLabel("学习等级")).toHaveValue("CET4");
  await expect(page.getByLabel("学习状态")).toHaveValue("doing");
  await expect(page.locator(".route-stage").getByRole("heading", { name: "四级 · 四级词汇语法" })).toBeVisible();
  await expect(page.locator(".track-entry").first()).toContainText("继续");

  await page.goto("/#/lesson/lesson-049");
  await page.getByRole("button", { name: "退出并保存" }).click();
  await expect(page.getByLabel("学习等级")).toHaveValue("CET4");
  await expect(page.locator(".route-stage").getByRole("heading", { name: "四级 · 四级词汇语法" })).toBeVisible();
});

test("main pages do not emit JavaScript runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await finishOnboarding(page);
  for (const route of ["/", "/map", "/review", "/discover", "/profile", "/lesson/lesson-001"]) {
    await page.goto(`/#${route}`);
    await page.locator(".shell-main .page").waitFor({ state: "visible" });
  }

  expect(errors).toEqual([]);
});

test("wrong answers reveal and persist a correction", async ({ page }) => {
  await finishOnboarding(page);
  await page.goto("/#/lesson/lesson-001");
  await page.locator(".option-list .option-button").filter({ hasNotText: "hello" }).first().click();
  await page.getByRole("button", { name: "提交答案" }).click();
  await expect(page.getByText("这题还没有答对")).toBeVisible();
  await expect(page.getByText("正确答案", { exact: true })).toBeVisible();
  await expect(page.locator("#ex-001-01-feedback").getByText("hello", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /重新作答/ }).click();
  await page.getByRole("button", { name: "hello" }).click();
  await page.getByRole("button", { name: "提交订正" }).click();
  await expect(page.getByText("订正正确")).toBeVisible();
  await page.reload();
  await expect(page.getByText("订正正确")).toBeVisible();
});

test("due review stays empty while free practice remains available", async ({ page }) => {
  await finishOnboarding(page);
  await page.goto("/#/review");
  await expect(page.getByRole("heading", { name: "今天没有到期复习" })).toBeVisible();
  await page.getByRole("tab", { name: /自由练习/ }).click();
  await expect(page.getByText(/1 \/ 8/)).toBeVisible();
});
