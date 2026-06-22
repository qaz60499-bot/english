import { expect, test, type Page } from "@playwright/test";

async function finishOnboarding(page: Page) {
  await page.goto("/");
  const enterButton = page.getByRole("button", { name: "进入英语星球" });
  const visible = await enterButton.waitFor({ state: "visible", timeout: 5000 }).then(() => true).catch(() => false);
  if (visible) await enterButton.click();
  await expect(page).toHaveURL(/#\/$/);
}

test("short today page keeps navigation in the final viewport row", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await finishOnboarding(page);

  const assertNavigationAtViewportBottom = async () => {
    await expect.poll(async () => page.evaluate(() => {
      const navigation = document.querySelector<HTMLElement>(".bottom-nav");
      if (!navigation) return Number.POSITIVE_INFINITY;
      return Math.abs(window.innerHeight - navigation.getBoundingClientRect().bottom);
    })).toBeLessThanOrEqual(2);
  };

  await assertNavigationAtViewportBottom();
  await page.setViewportSize({ width: 390, height: 520 });
  await assertNavigationAtViewportBottom();
  await page.setViewportSize({ width: 360, height: 780 });
  await assertNavigationAtViewportBottom();
  await page.screenshot({ path: "output/english-mobile-home.png", fullPage: false });
});

test("mobile lesson stays compact and bottom navigation stays attached to the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await finishOnboarding(page);
  await page.goto("/#/lesson/lesson-050");
  await page.getByRole("button", { name: "跳过并查看答案" }).click();
  await page.getByRole("button", { name: /下一题/ }).click();
  await expect(page.getByRole("button", { name: "播放" })).toBeVisible();

  const layout = await page.evaluate(() => {
    const nav = document.querySelector<HTMLElement>(".bottom-nav")?.getBoundingClientRect();
    const submit = document.querySelector<HTMLElement>(".submit-action")?.getBoundingClientRect();
    return {
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      navBottom: nav?.bottom ?? 0,
      navTop: nav?.top ?? 0,
      submitBottom: submit?.bottom ?? 0
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(Math.abs(layout.viewportHeight - layout.navBottom)).toBeLessThanOrEqual(2);
  expect(layout.navTop).toBeGreaterThan(layout.submitBottom);
  await page.screenshot({ path: "output/english-mobile-lesson.png", fullPage: false });
});
