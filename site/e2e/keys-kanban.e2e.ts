import { expect, test, type Page } from "@playwright/test";

// Keyboard behaviour from the kanban-board entry in src/lib/a11y-notes.ts (TSK-2205, TSK-2310),
// driven on the task app at /work, which opens on the board: To do, In progress, Review, Done.
test.beforeEach(() => {
  test.skip(test.info().project.name !== "1280-light", "keyboard specs run at 1280 light only");
});
test.use({ actionTimeout: 3000 });

const PAGE = "/work";

const column = (page: Page, name: string) =>
  page.getByRole("region", { name: new RegExp(`^${name}`) });
const card = (page: Page, title: string) =>
  page.getByRole("listitem", { name: new RegExp(`^${title}`) });

async function focusCard(page: Page, title: string) {
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const target = card(page, title);
  await target.focus();
  await expect(target).toBeFocused();
  return target;
}

test("Tab moves through a column's cards in order", async ({ page }) => {
  await focusCard(page, "Record the demo video");
  await page.keyboard.press("Tab");
  await expect(card(page, "Pick a shipping date")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(card(page, "Launch on Product Hunt")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(card(page, "Pick a shipping date")).toBeFocused();
});

test("Alt+ArrowRight moves the card to the next column and keeps focus on it", async ({ page }) => {
  const moved = await focusCard(page, "Record the demo video");
  await page.keyboard.press("Alt+ArrowRight");
  await expect(
    column(page, "In progress").getByRole("listitem", { name: /^Record the demo video/ }),
  ).toBeVisible();
  await expect(
    column(page, "To do").getByRole("listitem", { name: /^Record the demo video/ }),
  ).toHaveCount(0);
  await expect(moved).toBeFocused();
  await expect(page.getByText("Moved to In progress")).toBeAttached();

  await page.keyboard.press("Alt+ArrowRight");
  await expect(
    column(page, "Review").getByRole("listitem", { name: /^Record the demo video/ }),
  ).toBeVisible();
  await expect(moved).toBeFocused();
  await expect(page.getByText("Moved to Review")).toBeAttached();
});

test("Alt+ArrowLeft moves the card to the previous column and keeps focus on it", async ({
  page,
}) => {
  const moved = await focusCard(page, "Write the pricing page");
  await page.keyboard.press("Alt+ArrowLeft");
  await expect(
    column(page, "In progress").getByRole("listitem", { name: /^Write the pricing page/ }),
  ).toBeVisible();
  await expect(
    column(page, "Review").getByRole("listitem", { name: /^Write the pricing page/ }),
  ).toHaveCount(0);
  await expect(moved).toBeFocused();
  await expect(page.getByText("Moved to In progress")).toBeAttached();
});

test("a card at the edge stays put", async ({ page }) => {
  const first = await focusCard(page, "Record the demo video");
  await page.keyboard.press("Alt+ArrowLeft");
  await expect(
    column(page, "To do").getByRole("listitem", { name: /^Record the demo video/ }),
  ).toBeVisible();
  await expect(first).toBeFocused();
});
