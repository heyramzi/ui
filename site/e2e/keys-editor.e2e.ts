import { expect, test, type Page } from "@playwright/test";

/*
 * The rich editor on /components/rich-editor by keyboard, as its entry in site/src/lib/a11y-notes.ts
 * states it: "/" opens the command menu, the arrows move a highlight the text points at, Enter runs
 * it and Esc closes it with focus kept in the text; Cmd+B and friends press their toolbar button;
 * the toolbar is one Tab stop the arrows move along; Cmd+K opens the link field, Enter applies
 * and Esc cancels back to the text.
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
  const bold = page.getByRole("button", { name: "Bold" });
  const italic = page.getByRole("button", { name: "Italic" });
  await expect(bold).toHaveAttribute("aria-pressed", "false");

  await page.keyboard.press("ControlOrMeta+b");
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ControlOrMeta+i");
  await expect(italic).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.type("loud");
  await expect(text.locator("strong em, em strong").getByText("loud")).toBeVisible();

  await page.keyboard.press("ControlOrMeta+b");
  await expect(bold).toHaveAttribute("aria-pressed", "false");

  // A toolbar button runs on Enter and hands focus back to the text.
  await page.keyboard.press("ControlOrMeta+i");
  await expect(italic).toHaveAttribute("aria-pressed", "false");
  await italic.focus();
  await page.keyboard.press("Enter");
  await expect(italic).toHaveAttribute("aria-pressed", "true");
  await expect(text).toBeFocused();
});

test("the toolbar is one Tab stop and the arrows move along it", async ({ page }) => {
  const { text } = await openEditor(page);
  const toolbar = page.getByRole("toolbar", { name: "Formatting" });
  const h1 = toolbar.getByRole("radio", { name: "Heading 1" });
  const h2 = toolbar.getByRole("radio", { name: "Heading 2" });
  const bold = toolbar.getByRole("button", { name: "Bold" });

  await page.keyboard.press("Shift+Tab");
  await expect(h1).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(h2).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(bold).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(toolbar.getByRole("radio", { name: "Heading 3" })).toBeFocused();
  await page.keyboard.press("End");
  await expect(toolbar.getByRole("button", { name: "Insert YouTube video" })).toBeFocused();
  // The arrows wrap at both ends.
  await page.keyboard.press("ArrowRight");
  await expect(h1).toBeFocused();

  // Tab leaves the toolbar whole, and Shift+Tab comes back to the button last reached.
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Tab");
  await expect(text).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(h2).toBeFocused();

  // The headings are one pick: Space sets H2 and focus returns to the text.
  await expect(h2).toHaveAttribute("aria-checked", "false");
  await page.keyboard.press("Space");
  await expect(text).toBeFocused();
  await expect(h2).toHaveAttribute("aria-checked", "true");
  await expect(h1).toHaveAttribute("aria-checked", "false");
  await page.keyboard.type("Picked from the toolbar");
  await expect(
    text.getByRole("heading", { level: 2, name: "Picked from the toolbar" }),
  ).toBeVisible();
});

test("arrowing onto an image opens its toolbar, one Tab stop away from the text", async ({
  page,
}) => {
  const { text } = await openEditor(page);
  // An image, then an empty line under it holding the caret.
  await text.evaluate((el) => {
    type Chain = { insertContent: (c: unknown) => Chain; run: () => boolean };
    (el as Element & { editor: { chain: () => Chain } }).editor
      .chain()
      .insertContent([
        { type: "image", attrs: { src: "/avatars/02.png", alt: "Avatar" } },
        { type: "paragraph" },
      ])
      .run();
  });
  const image = text.getByRole("img", { name: "Avatar" });
  await expect(image).toBeVisible();
  const toolbar = page.getByRole("toolbar", { name: "Image" });
  await expect(toolbar).toBeHidden();

  await page.keyboard.press("ArrowUp");
  await expect(toolbar).toBeVisible();
  await expect(text).toBeFocused();
  // It floats over the image, not on it.
  const bar = await toolbar.boundingBox();
  const img = await image.boundingBox();
  expect(bar && img && bar.y + bar.height <= img.y).toBe(true);

  // One Tab stop: Tab lands on the first button, the arrows walk the rest.
  await page.keyboard.press("Tab");
  const left = toolbar.getByRole("button", { name: "Align left" });
  await expect(left).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(toolbar.getByRole("button", { name: "Align center" })).toBeFocused();
  await page.keyboard.press("End");
  await expect(toolbar.getByRole("button", { name: "Delete image" })).toBeFocused();

  // Esc closes it and puts focus back in the text, image still selected.
  await page.keyboard.press("Escape");
  await expect(toolbar).toBeHidden();
  await expect(text).toBeFocused();

  // Back onto the image and pick an alignment: it applies and focus returns to the text.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  await expect(toolbar).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(image).toHaveAttribute("data-align", "center");
  await expect(toolbar).toBeHidden();
  await expect(text).toBeFocused();
});

test("the image command asks for a link in a dialog and shows a bad one inline", async ({
  page,
}) => {
  const { text } = await openEditor(page);
  await page.keyboard.type("/image");
  await expect(
    page.getByRole("listbox", { name: "Commands" }).getByRole("option").first(),
  ).toContainText("Image");
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Insert image" });
  const field = dialog.getByRole("textbox", { name: "Image link" });
  await expect(field).toBeFocused();

  // A script link is refused where you typed it, and focus stays in the field.
  await page.keyboard.type("javascript:alert(1)");
  await page.keyboard.press("Enter");
  await expect(dialog.getByRole("alert")).toHaveText("That is not a link to an image.");
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect(field).toBeFocused();

  await field.fill("/avatars/02.png");
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();
  await expect(text).toBeFocused();
  await expect(text.locator('img[src="/avatars/02.png"]')).toBeVisible();
});

test("the video dialog opens from the slash menu, Esc cancels and Enter inserts", async ({
  page,
}) => {
  const { text } = await openEditor(page);
  const dialog = page.getByRole("dialog", { name: "Insert YouTube video" });
  const field = dialog.getByRole("textbox", { name: "YouTube link" });
  const openDialog = async () => {
    await page.keyboard.type("/youtube");
    await expect(
      page.getByRole("listbox", { name: "Commands" }).getByRole("option").first(),
    ).toContainText("YouTube");
    await page.keyboard.press("Enter");
    await expect(field).toBeFocused();
  };

  await openDialog();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(text).toBeFocused();
  await expect(text.locator("[data-video-id]")).toHaveCount(0);

  await openDialog();
  await page.keyboard.type("https://example.com/watch?v=dQw4w9WgXcQ");
  await page.keyboard.press("Enter");
  await expect(dialog.getByRole("alert")).toHaveText("That is not a recognized YouTube URL.");
  await expect(field).toBeFocused();

  await field.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42");
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("textbox", { name: "Title (optional)" })).toBeFocused();
  await page.keyboard.type("Made by keys");
  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();
  await expect(text).toBeFocused();
  const video = text.locator('[data-video-id="dQw4w9WgXcQ"]');
  await expect(video).toHaveAttribute("data-start", "42");
  await expect(video).toContainText("Made by keys");
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
