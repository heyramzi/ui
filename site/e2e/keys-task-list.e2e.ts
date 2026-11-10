import { expect, test, type Locator, type Page } from "@playwright/test";

/*
 * The task list on /work by keyboard, as its entry in site/src/lib/a11y-notes.ts states it: fold
 * buttons fold on Enter and Space and report it, a folded group's rows leave the Tab order, and
 * Alt+ArrowDown or Alt+ArrowUp sends the focused row to the next group, keeps focus on it and
 * says "Moved to" that group.
 */

test.beforeEach(() => {
  test.skip(test.info().project.name !== "1280-light", "keyboard specs run at 1280 light only");
});
test.use({ actionTimeout: 3000 });

async function openList(page: Page) {
  await page.goto("/work", { waitUntil: "networkidle" });
  const list = page.getByRole("radio", { name: "List", exact: true }).first();
  await list.click();
  await expect(list).toHaveAttribute("aria-checked", "true");
  const group = (name: string) => page.getByRole("region", { name, exact: true });
  await expect(group("To do")).toBeVisible();
  return { group };
}

/**
 * True when every row sits inside an inert subtree. A folded group keeps its rows mounted for the
 * fold animation, so they still count; inert is what takes them out of the Tab order.
 */
function allInert(rows: Locator): Promise<boolean> {
  return rows.evaluateAll(
    (els) => els.length > 0 && els.every((el) => el.closest("[inert]") !== null),
  );
}

test("Alt+arrows move the focused row between groups and keep focus on it", async ({ page }) => {
  const { group } = await openList(page);
  const todo = group("To do").getByRole("listitem");
  const row = todo.first();
  const title = (await row.getAttribute("aria-label")) ?? (await row.innerText()).split("\n")[0];
  const named = (scope: ReturnType<typeof group>) =>
    scope.getByRole("listitem").filter({ hasText: title.trim() });

  await expect(row).toHaveAttribute("aria-keyshortcuts", "Alt+ArrowUp Alt+ArrowDown");
  await row.focus();
  await page.keyboard.press("Alt+ArrowDown");
  await expect(named(group("In progress"))).toHaveCount(1);
  await expect(named(group("To do"))).toHaveCount(0);
  await expect(named(group("In progress"))).toBeFocused();
  await expect(page.getByText("Moved to In progress")).toBeAttached();

  // In manual order a moved row lands at the end of its new group.
  await expect(group("In progress").getByRole("listitem").last()).toBeFocused();

  await page.keyboard.press("Alt+ArrowDown");
  await expect(named(group("Review"))).toBeFocused();
  await expect(page.getByText("Moved to Review")).toBeAttached();

  await page.keyboard.press("Alt+ArrowUp");
  await page.keyboard.press("Alt+ArrowUp");
  await expect(named(group("To do"))).toBeFocused();
  await expect(page.getByText("Moved to To do")).toBeAttached();

  // At the top there is no group above, so the row stays.
  await page.keyboard.press("Alt+ArrowUp");
  await expect(named(group("To do"))).toBeFocused();
});

test("a fold button folds on Enter and Space and its rows leave the Tab order", async ({
  page,
}) => {
  const { group } = await openList(page);
  const fold = page.getByRole("button", { name: "Fold To do" });
  await expect(fold).toHaveAttribute("aria-expanded", "true");
  const rows = group("To do").getByRole("listitem");
  await expect(rows.first()).toBeVisible();

  await fold.focus();
  await page.keyboard.press("Enter");
  const unfold = page.getByRole("button", { name: "Unfold To do" });
  await expect(unfold).toHaveAttribute("aria-expanded", "false");
  await expect(unfold).toBeFocused();
  await expect.poll(() => allInert(rows)).toBe(true);
  // A row can't take focus while its group is folded.
  await rows.first().evaluate((el) => (el as HTMLElement).focus());
  await expect(rows.first()).not.toBeFocused();

  await unfold.focus();
  await page.keyboard.press("Space");
  await expect(fold).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => allInert(rows)).toBe(false);
  await expect(rows.first()).toBeVisible();
});

test("a row moved into a folded group opens it", async ({ page }) => {
  const { group } = await openList(page);
  await page.getByRole("button", { name: "Fold In progress" }).click();
  await expect.poll(() => allInert(group("In progress").getByRole("listitem"))).toBe(true);

  const row = group("To do").getByRole("listitem").first();
  await row.focus();
  await page.keyboard.press("Alt+ArrowDown");
  await expect(page.getByRole("button", { name: "Fold In progress" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(group("In progress").getByRole("listitem").last()).toBeFocused();
});
