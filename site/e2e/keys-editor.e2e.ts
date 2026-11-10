import { expect, test, type Page } from "@playwright/test";

/*
 * The rich editor on /components/rich-editor by keyboard, as its entry in site/src/lib/a11y-notes.ts
 * states it: "/" opens the command menu, the arrows move a highlight the text points at, Enter runs
 * it and Esc closes it with focus kept in the text; Cmd+B and friends press their toolbar button;
 * Cmd+K opens the link field, Enter applies and Esc cancels back to the text.
 */

test.beforeEach(() => {
  test.skip(test.info().project.name !== "1280-light", "keyboard specs run at 1280 light only");
});
test.use({ actionTimeout: 3000 });

async function openEditor(page: Page) {
  await page.goto("/components/rich-editor", { waitUntil: "networkidle" });
  const text = page.getByRole("textbox", { name: "Text editor" }).first();
  await expect(text).toBeVisible();
  // Caret to the line end (Cmd+ArrowRight on macOS, where End only scrolls), then a fresh line.

  // Tiptap's own selection, which can lag the page's caret just after a click.
  const line = text.getByText("Type a slash for headings");
  const caret = () =>
    text.evaluate((el) => {
      type Selection = {
        empty: boolean;
        $from: { parentOffset: number; parent: { textContent: string; content: { size: number } } };
      };
      const { $from, empty } = (el as unknown as { editor: { state: { selection: Selection } } })
        .editor.state.selection;
      const { parent } = $from;
      return { empty, text: parent.textContent, atEnd: $from.parentOffset === parent.content.size };
    });
  await expect(async () => {
    await line.click();
    await page.keyboard.press(process.platform === "darwin" ? "Meta+ArrowRight" : "End");
    const now = await caret();
    expect(now.empty && now.atEnd && now.text.startsWith("Type a slash for headings")).toBe(true);
  }).toPass({ timeout: 5000 });
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await caret()).text).toBe("");
  return { text };
}

test("slash opens the command menu, arrows move the highlight, Enter runs it", async ({ page }) => {
  const { text } = await openEditor(page);
  await page.keyboard.type("/");
  const menu = page.getByRole("listbox", { name: "Commands" });
  await expect(menu).toBeVisible();
  await expect(text).toBeFocused();

  const options = menu.getByRole("option");
  await expect(options.first()).toHaveAttribute("aria-selected", "true");
  const firstId = await options.first().getAttribute("id");
  await expect(text).toHaveAttribute("aria-activedescendant", firstId ?? "");

  await page.keyboard.press("ArrowDown");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(options.first()).toHaveAttribute("aria-selected", "false");
  await expect(text).toHaveAttribute(
    "aria-activedescendant",
    (await options.nth(1).getAttribute("id")) ?? "",
  );
  await page.keyboard.press("ArrowUp");
  await expect(options.first()).toHaveAttribute("aria-selected", "true");

  // Typing filters the menu; Enter runs the highlighted command on the current line.
  await page.keyboard.type("heading 2");
  await expect(options.first()).toContainText("Heading 2");
  await page.keyboard.press("Enter");
  await expect(menu).toBeHidden();
  await expect(text).toBeFocused();
  await expect(text).not.toHaveAttribute("aria-activedescendant", /.+/);
  await page.keyboard.type("Made by keys");
  await expect(text.getByRole("heading", { level: 2, name: "Made by keys" })).toBeVisible();
});

test("Esc closes the command menu and keeps focus in the text", async ({ page }) => {
  const { text } = await openEditor(page);
  await page.keyboard.type("/");
  const menu = page.getByRole("listbox", { name: "Commands" });
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(text).toBeFocused();
  await expect(text).not.toHaveAttribute("aria-activedescendant", /.+/);
});

test("mark keys press their toolbar button", async ({ page }) => {
  const { text } = await openEditor(page);
  const bold = page.getByRole("button", { name: "Bold (Cmd+B)" });
  const italic = page.getByRole("button", { name: "Italic (Cmd+I)" });
  await expect(bold).toHaveAttribute("aria-pressed", "false");

  await page.keyboard.press("ControlOrMeta+b");
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ControlOrMeta+i");
  await expect(italic).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.type("loud");
  await expect(text.locator("strong em, em strong").getByText("loud")).toBeVisible();

  await page.keyboard.press("ControlOrMeta+b");
  await expect(bold).toHaveAttribute("aria-pressed", "false");

  // Toolbar buttons are their own Tab stops and run on Enter.
  await page.keyboard.press("ControlOrMeta+i");
  await expect(italic).toHaveAttribute("aria-pressed", "false");
  await italic.focus();
  await page.keyboard.press("Enter");
  await expect(italic).toHaveAttribute("aria-pressed", "true");
  await expect(text).toBeFocused();
});

test("Cmd+K opens the link field, Enter applies and Esc returns to the text", async ({ page }) => {
  const { text } = await openEditor(page);
  await page.keyboard.type("docs");
  // Shift+ArrowLeft until it reads "docs": the first press can land before the typing does.
  const selected = () => page.evaluate(() => getSelection()?.toString() ?? "");
  await expect(async () => {
    if ((await selected()).length < 4) await page.keyboard.press("Shift+ArrowLeft");
    expect(await selected()).toBe("docs");
  }).toPass({ timeout: 5000 });

  await page.keyboard.press("ControlOrMeta+k");
  const field = page.getByRole("textbox", { name: "Paste link..." });
  await expect(field).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(field).toBeHidden();
  await expect(text).toBeFocused();
  await expect.poll(selected).toBe("docs");
  await expect(text.getByRole("link", { name: "docs" })).toHaveCount(0);

  await page.keyboard.press("ControlOrMeta+k");
  await expect(field).toBeFocused();
  await page.keyboard.type("https://example.com/docs");
  await page.keyboard.press("Enter");
  await expect(field).toBeHidden();
  await expect(text.getByRole("link", { name: "docs" })).toHaveAttribute(
    "href",
    "https://example.com/docs",
  );
});
