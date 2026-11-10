import { expect, test, type Locator, type Page } from "@playwright/test";

// Keyboard behaviour from the star-rating-input entry in src/lib/a11y-notes.ts (TSK-2205, TSK-2310).
// The first demo is "Rate the delivery", 5 stars with labels, starting at zero.
test.beforeEach(() => {
  test.skip(test.info().project.name !== "1280-light", "keyboard specs run at 1280 light only");
});
test.use({ actionTimeout: 3000 });

const PAGE = "/components/star-rating-input";

async function stars(page: Page): Promise<Locator> {
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const slider = page.getByRole("slider", { name: "Rate the delivery" });
  await slider.focus();
  await expect(slider).toBeFocused();
  await expect(slider).toHaveAttribute("aria-valuenow", "0");
  return slider;
}

const value = (slider: Locator, n: number) =>
  expect(slider).toHaveAttribute("aria-valuenow", String(n));

test("the stars are one Tab stop", async ({ page }) => {
  const slider = await stars(page);
  await page.keyboard.press("Tab");
  await expect(slider).not.toBeFocused();
  await expect(page.getByRole("slider", { name: "Rating" }).first()).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(slider).toBeFocused();
});

test("ArrowRight and ArrowUp add a star", async ({ page }) => {
  const slider = await stars(page);
  await page.keyboard.press("ArrowRight");
  await value(slider, 1);
  await page.keyboard.press("ArrowUp");
  await value(slider, 2);
  await expect(slider).toHaveAttribute("aria-valuetext", /2 of 5 stars/);
});

test("ArrowLeft and ArrowDown take a star off, down to zero", async ({ page }) => {
  const slider = await stars(page);
  await page.keyboard.press("3");
  await value(slider, 3);
  await page.keyboard.press("ArrowLeft");
  await value(slider, 2);
  await page.keyboard.press("ArrowDown");
  await value(slider, 1);
  await page.keyboard.press("ArrowDown");
  await value(slider, 0);
  await page.keyboard.press("ArrowLeft");
  await value(slider, 0);
  await expect(slider).toHaveAttribute("aria-valuetext", /No rating/);
});

test("End sets the top rating and Home clears it", async ({ page }) => {
  const slider = await stars(page);
  await page.keyboard.press("End");
  await value(slider, 5);
  await page.keyboard.press("ArrowRight");
  await value(slider, 5);
  await page.keyboard.press("Home");
  await value(slider, 0);
});

test("a digit sets that many stars", async ({ page }) => {
  const slider = await stars(page);
  for (const n of [4, 1, 5, 2, 3]) {
    await page.keyboard.press(String(n));
    await value(slider, n);
  }
  await expect(slider).toHaveAttribute("aria-valuetext", /3 of 5 stars/);
});
