import { expect, test, type Page } from "@playwright/test";

// Keyboard behaviour from the picker entry in src/lib/a11y-notes.ts (TSK-2205, TSK-2310).
// The demo has 4 options, so there's no search box: focus lands on the list.
test.beforeEach(() => {
  test.skip(test.info().project.name !== "1280-light", "keyboard specs run at 1280 light only");
});
test.use({ actionTimeout: 3000 });

const PAGE = "/components/picker";

async function openWith(page: Page, key: string) {
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: "Normal", exact: true });
  await trigger.focus();
  await page.keyboard.press(key);
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  // Focus moved off the trigger into the menu, where Command's keys live.
  await expect(trigger).not.toBeFocused();
  await expect
    .poll(() => page.evaluate(() => !!document.activeElement?.closest("[data-command-root]")))
    .toBe(true);
  return { trigger, list };
}

const highlighted = (page: Page) => page.getByRole("option", { selected: true });

for (const key of ["Enter", "Space"]) {
  test(`${key} on the trigger opens the menu`, async ({ page }) => {
    await openWith(page, key);
    await expect(page.getByRole("option")).toHaveCount(4);
  });
}

test("arrows move the highlight and loop, Home and End jump", async ({ page }) => {
  await openWith(page, "Enter");
  await page.keyboard.press("Home");
  await expect(highlighted(page)).toContainText("Urgent");
  await page.keyboard.press("ArrowDown");
  await expect(highlighted(page)).toContainText("High");
  await page.keyboard.press("End");
  await expect(highlighted(page)).toContainText("Low");
  await page.keyboard.press("ArrowDown");
  await expect(highlighted(page)).toContainText("Urgent");
  await page.keyboard.press("ArrowUp");
  await expect(highlighted(page)).toContainText("Low");
});

test("a letter jumps to the next option that starts with it", async ({ page }) => {
  await openWith(page, "Enter");
  await page.keyboard.press("Home");
  await page.keyboard.press("l");
  await expect(highlighted(page)).toContainText("Low");
  await page.keyboard.press("h");
  await expect(highlighted(page)).toContainText("High");
});

test("Enter picks the highlighted option, closes and returns focus", async ({ page }) => {
  const { list } = await openWith(page, "Enter");
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowDown");
  await expect(highlighted(page)).toContainText("High");
  await page.keyboard.press("Enter");
  await expect(list).toBeHidden();
  const trigger = page.getByRole("button", { name: "High", exact: true });
  await expect(trigger).toBeFocused();
});

test("Esc closes without picking and returns focus to the trigger", async ({ page }) => {
  const { trigger, list } = await openWith(page, "Enter");
  await page.keyboard.press("End");
  await page.keyboard.press("Escape");
  await expect(list).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAccessibleName("Normal");
});
