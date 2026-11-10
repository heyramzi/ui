import { expect, test, type Locator, type Page } from "@playwright/test";

/*
 * The canvas on /components/canvas by keyboard, as its entry in site/src/lib/a11y-notes.ts states
 * it: tool buttons are named and report pressed, a bare letter picks its tool, Enter selects a
 * named node, arrows nudge it 5px (20px with Shift) and announce it, Esc deselects, Delete removes.
 */

test.beforeEach(() => {
  test.skip(test.info().project.name !== "1280-light", "keyboard specs run at 1280 light only");
});
test.use({ actionTimeout: 3000 });

async function openCanvas(page: Page) {
  await page.goto("/components/canvas", { waitUntil: "networkidle" });
  const canvas = page.getByRole("group", { name: "Canvas" });
  const toolbar = canvas.getByRole("toolbar", { name: "Canvas tools" });
  await expect(toolbar).toBeVisible();
  const tool = (name: string) => toolbar.getByRole("button", { name, exact: true });
  return { canvas, toolbar, tool };
}

/** The node's x and y from the transform Svelte Flow writes on it. */
async function position(node: Locator): Promise<{ x: number; y: number }> {
  const transform = await node.evaluate((el) => (el as HTMLElement).style.transform);
  const [x, y] = (transform.match(/-?[\d.]+/g) ?? []).map(Number);
  return { x: x ?? NaN, y: y ?? NaN };
}

test("a bare letter picks its tool, a modified one doesn't", async ({ page }) => {
  const { tool } = await openCanvas(page);
  await expect(tool("Select")).toHaveAttribute("aria-pressed", "true");

  await tool("Select").focus();
  await page.keyboard.press("p");
  await expect(tool("Pen")).toHaveAttribute("aria-pressed", "true");
  await expect(tool("Select")).toHaveAttribute("aria-pressed", "false");

  await page.keyboard.press("h");
  await expect(tool("Hand")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("t");
  await expect(tool("Text")).toHaveAttribute("aria-pressed", "true");

  // Shift and Cmd/Ctrl keep their own meaning, so they pick no tool.
  await page.keyboard.press("Shift+V");
  await expect(tool("Text")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("v");
  await expect(tool("Select")).toHaveAttribute("aria-pressed", "true");

  // Space on a focused tool button presses it like any button.
  await tool("Hand").focus();
  await page.keyboard.press("Space");
  await expect(tool("Hand")).toHaveAttribute("aria-pressed", "true");
});

test("a node is selected by Enter, nudged by arrows and freed by Esc", async ({ page }) => {
  const { canvas, tool } = await openCanvas(page);
  const idea = canvas.getByLabel("Rectangle: Idea");
  await expect(idea).toBeVisible();

  await idea.focus();
  await expect(idea).toBeFocused();
  await page.keyboard.press("Enter");

  const start = await position(idea);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => position(idea)).toEqual({ x: start.x + 5, y: start.y });
  await page.keyboard.press("Shift+ArrowDown");
  await expect.poll(() => position(idea)).toEqual({ x: start.x + 5, y: start.y + 20 });
  // A live region reads every move out.
  await expect(page.locator("[aria-live]").filter({ hasText: /moved/i }).first()).toBeAttached();

  await page.keyboard.press("Escape");
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => position(idea)).toEqual({ x: start.x + 5, y: start.y + 20 });

  // A letter typed on a focused node still picks its tool. The pen's Style toolbar has its own
  // "Pen" button, so the tool is looked up in the tools toolbar.
  await expect(idea).toBeFocused();
  await page.keyboard.press("p");
  await expect(tool("Pen")).toHaveAttribute("aria-pressed", "true");
});

test("Delete and Backspace remove the selected node", async ({ page }) => {
  const { canvas } = await openCanvas(page);
  const idea = canvas.getByLabel("Rectangle: Idea");
  await idea.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Delete");
  await expect(idea).toHaveCount(0);

  const title = canvas.getByLabel("Draw on me");
  await title.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("Backspace");
  await expect(title).toHaveCount(0);
  await expect(canvas.getByLabel(/Ship/)).toBeVisible();
});
