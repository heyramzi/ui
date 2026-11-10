import { expect, test, type Page } from "@playwright/test";

// Keyboard behaviour from the ai-prompt entry in src/lib/a11y-notes.ts (TSK-2205, TSK-2310).
// The demo's reply runs for 2 s after a send, and its Stop button ends it.
test.beforeEach(() => {
  test.skip(test.info().project.name !== "1280-light", "keyboard specs run at 1280 light only");
});
test.use({ actionTimeout: 3000 });

const PAGE = "/components/ai-prompt";

async function box(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const message = page.getByRole("textbox", { name: "Message" });
  await message.focus();
  return { message, errors };
}

const submit = (page: Page) => page.getByRole("button", { name: "Submit", exact: true });
const stop = (page: Page) => page.getByRole("button", { name: "Stop", exact: true });

test("Enter sends the message", async ({ page }) => {
  const { message, errors } = await box(page);
  await page.keyboard.type("Summarize the week");
  await page.keyboard.press("Enter");
  await expect(message).toHaveValue("");
  await expect(stop(page)).toBeVisible();
  await expect(submit(page)).toBeVisible({ timeout: 4000 });
  expect(errors).toEqual([]);
});

test("Shift+Enter adds a new line and does not send", async ({ page }) => {
  const { message } = await box(page);
  await page.keyboard.type("First line");
  await page.keyboard.press("Shift+Enter");
  await page.keyboard.type("Second line");
  await expect(message).toHaveValue("First line\nSecond line");
  await expect(submit(page)).toBeVisible();
  await expect(stop(page)).toHaveCount(0);
});

test("Cmd or Ctrl+Enter sends", async ({ page }) => {
  const { message } = await box(page);
  await page.keyboard.type("Draft a reply");
  await page.keyboard.press("ControlOrMeta+Enter");
  await expect(message).toHaveValue("");
  await expect(stop(page)).toBeVisible();
});

test("Enter in the box while a reply runs keeps the text and throws nothing", async ({ page }) => {
  const { message, errors } = await box(page);
  await page.keyboard.type("One");
  await page.keyboard.press("Enter");
  await expect(stop(page)).toBeVisible();
  await page.keyboard.type("Two");
  await page.keyboard.press("Enter");
  await expect(message).toHaveValue("Two");
  await expect(stop(page)).toBeVisible();
  expect(errors).toEqual([]);
});

for (const key of ["Enter", "Space"]) {
  test(`${key} on the submit button sends, and on Stop ends the reply`, async ({ page }) => {
    const { message } = await box(page);
    await page.keyboard.type("Check the inbox");
    await submit(page).focus();
    await page.keyboard.press(key);
    await expect(message).toHaveValue("");
    await expect(stop(page)).toBeFocused();
    await page.keyboard.press(key);
    // Well under the demo's 2 s reply, so only Stop can have ended it.
    await expect(submit(page)).toBeVisible({ timeout: 1000 });
    await expect(submit(page)).toBeFocused();
  });
}

test("Enter does nothing while an input method is composing", async ({ page }) => {
  const { message } = await box(page);
  await page.keyboard.type("Kana");
  await message.dispatchEvent("keydown", { key: "Enter", isComposing: true, bubbles: true });
  await expect(message).toHaveValue("Kana");
  await expect(stop(page)).toHaveCount(0);
});
