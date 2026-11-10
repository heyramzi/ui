import { expect, test, type Page } from "@playwright/test";

/*
 * The thread on /components/thread by keyboard, as its entry in site/src/lib/a11y-notes.ts states
 * it: opening a reply or an edit puts focus in its box, Esc cancels and hands focus back,
 * Cmd/Ctrl+Enter sends, and a delete moves focus to the next comment.
 */

test.beforeEach(() => {
  test.skip(test.info().project.name !== "1280-light", "keyboard specs run at 1280 light only");
});
test.use({ actionTimeout: 3000 });

const FIRST = "The three plans fit one screen on a laptop";
const PINNED = "Pin this on the pricing node";

async function openThread(page: Page) {
  await page.goto("/components/thread", { waitUntil: "networkidle" });
  const thread = page.getByRole("region", { name: "Activity" });
  await expect(thread).toBeVisible();
  const comment = (text: string) => thread.getByRole("listitem").filter({ hasText: text }).first();
  return { thread, comment };
}

test("Reply opens a box in focus, Esc and Cmd+Enter hand focus back", async ({ page }) => {
  const { thread, comment } = await openThread(page);
  const reply = comment(FIRST).getByRole("button", { name: "Reply", exact: true }).first();

  await reply.focus();
  await page.keyboard.press("Enter");
  const box = thread.getByRole("textbox", { name: "Reply" });
  await expect(box).toBeFocused();
  await page.keyboard.type("Not cut yet");
  await page.keyboard.press("Escape");
  await expect(box).toHaveCount(0);
  await expect(reply).toBeFocused();
  await expect(thread.getByText("Not cut yet")).toHaveCount(0);

  await page.keyboard.press("Enter");
  await expect(box).toBeFocused();
  await page.keyboard.type("Cut it on Friday");
  await page.keyboard.press("ControlOrMeta+Enter");
  await expect(comment(FIRST).getByText("Cut it on Friday")).toBeVisible();
  await expect(box).toHaveCount(0);
  await expect(reply).toBeFocused();
});

test("Edit opens a box in focus, Esc cancels and Save keeps the words", async ({ page }) => {
  const { thread, comment } = await openThread(page);
  const edit = comment(FIRST).getByRole("button", { name: "Edit comment" }).first();

  await edit.focus();
  await page.keyboard.press("Enter");
  const box = thread.getByRole("textbox", { name: "Edit comment" });
  await expect(box).toBeFocused();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Throwaway words");
  await page.keyboard.press("Escape");
  await expect(box).toHaveCount(0);
  await expect(edit).toBeFocused();
  await expect(comment(FIRST)).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(box).toBeFocused();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("One screen, no table");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(thread.getByRole("button", { name: "Save" })).toBeFocused();
  await page.keyboard.press("Enter");
  const edited = comment("One screen, no table");
  await expect(edited).toBeVisible();
  await expect(edited.getByRole("button", { name: "Edit comment" }).first()).toBeFocused();
});

test("a delete moves focus to the next comment", async ({ page }) => {
  const { thread, comment } = await openThread(page);
  // A fresh comment lands last, so it is the one after the pinned comment.
  const composer = thread.getByRole("textbox", { name: "Leave a comment" });
  await composer.fill("Ship it Monday");
  await composer.press("ControlOrMeta+Enter");
  await expect(comment("Ship it Monday")).toBeVisible();

  const remove = comment(PINNED).getByRole("button", { name: "Delete comment" }).first();
  await remove.focus();
  await page.keyboard.press("Enter");
  await expect(thread.getByText(PINNED)).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.textContent ?? ""))
    .toContain("Ship it Monday");

  // Deleting the last comment sends focus to the one before it.
  await comment("Ship it Monday").getByRole("button", { name: "Delete comment" }).first().focus();
  await page.keyboard.press("Enter");
  await expect(thread.getByText("Ship it Monday")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.getAttribute("data-comment") ?? ""))
    .not.toBe("");
});

test("the composer sends on Cmd+Enter and keeps focus", async ({ page }) => {
  const { thread, comment } = await openThread(page);
  const composer = thread.getByRole("textbox", { name: "Leave a comment" });
  await composer.focus();
  await page.keyboard.type("Ship it Monday");
  await page.keyboard.press("ControlOrMeta+Enter");
  await expect(comment("Ship it Monday")).toBeVisible();
  await expect(composer).toHaveValue("");
  await expect(composer).toBeFocused();
});

test("Resolve and Show resolved report pressed", async ({ page }) => {
  const { thread, comment } = await openThread(page);
  const show = thread.getByRole("button", { name: "Show 1 resolved" });
  await expect(show).toHaveAttribute("aria-pressed", "false");
  await show.focus();
  await page.keyboard.press("Enter");
  await expect(thread.getByRole("button", { name: "Hide resolved" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(thread.getByText("Footer links checked")).toBeVisible();

  const resolve = comment(PINNED).getByRole("button", { name: "Resolve" }).first();
  await expect(resolve).toHaveAttribute("aria-pressed", "false");
  await resolve.focus();
  await page.keyboard.press("Space");
  await expect(
    comment(PINNED)
      .getByRole("button", { name: /Resolve|Reopen/ })
      .first(),
  ).toHaveAttribute("aria-pressed", "true");
});
