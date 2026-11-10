import { expect, test } from "@playwright/test";

/*
 * Tables by keyboard, as the data-table and table-view entries in site/src/lib/a11y-notes.ts state
 * them: a sortable head holds a real button that sorts on Enter and Space and flips on a second
 * press, the head reports the order, and Shift+F10 or the ContextMenu key opens a row's menu.
 */

test.beforeEach(() => {
  test.skip(test.info().project.name !== "1280-light", "keyboard specs run at 1280 light only");
});
test.use({ actionTimeout: 3000 });

test("data table: a sort button sorts on Enter and flips on Space", async ({ page }) => {
  await page.goto("/components/data-table", { waitUntil: "networkidle" });
  const table = page.getByRole("table").first();
  const head = (name: string) => table.getByRole("columnheader", { name });
  const firstCell = table.getByRole("row").nth(1).getByRole("cell").first();

  // The demo opens sorted by revenue, highest first.
  await expect(head("Revenue")).toHaveAttribute("aria-sort", "descending");
  await expect(firstCell).toHaveText("Atelier Morel");

  // Tab leaves the search box, passes Reload, then lands on the first sort button.
  await page.getByRole("textbox", { name: "Search clients" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Reload" })).toBeFocused();
  await page.keyboard.press("Tab");
  const client = head("Client").getByRole("button", { name: "Client" });
  await expect(client).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(head("Client")).toHaveAttribute("aria-sort", "ascending");
  await expect(head("Revenue")).not.toHaveAttribute("aria-sort", /ascending|descending/);
  await expect(firstCell).toHaveText("Acme Freight");
  await expect(client).toBeFocused();

  await page.keyboard.press("Space");
  await expect(head("Client")).toHaveAttribute("aria-sort", "descending");
  await expect(firstCell).toHaveText("Tidewater Marine");

  // Tab walks on to the next column's button.
  await page.keyboard.press("Tab");
  await expect(head("City").getByRole("button", { name: "City" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(head("City")).toHaveAttribute("aria-sort", "ascending");
  await expect(firstCell).toHaveText("Tidewater Marine");
});

test("table view: Shift+F10 and the ContextMenu key open a row's menu", async ({ page }) => {
  await page.goto("/components/table-view", { waitUntil: "networkidle" });
  const table = page.getByRole("table", { name: "Quote lines" });
  const row = (text: string) => table.getByRole("row").filter({ hasText: text });
  const build = row("Build the first module");

  // A row with a menu and no link of its own takes focus itself.
  await build.focus();
  await expect(build).toBeFocused();

  await page.keyboard.press("Shift+F10");
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Remove line" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(build).toBeFocused();

  await page.keyboard.press("ContextMenu");
  await expect(menu).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem", { name: "Remove line" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu).toBeHidden();
  await expect(row("Build the first module")).toHaveCount(0);
  await expect(row("Audit and scoping")).toBeVisible();
  await expect(row("Handover and training")).toBeVisible();
});
