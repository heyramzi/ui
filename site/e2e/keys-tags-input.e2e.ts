import { expect, test, type Page } from "@playwright/test";

// Keyboard behaviour from the tags-input entry in src/lib/a11y-notes.ts (TSK-2205, TSK-2310).
// The demo starts with Docusign and SharePoint, from 7 tools.
test.beforeEach(() => {
  test.skip(test.info().project.name !== "1280-light", "keyboard specs run at 1280 light only");
});
test.use({ actionTimeout: 3000 });

const PAGE = "/components/tags-input";

const field = (page: Page) => page.getByRole("button", { name: /^Tools/ });
const box = (page: Page) => page.getByRole("combobox", { name: "Tools" });
const chip = (page: Page, tag: string) => page.getByRole("button", { name: `Remove ${tag}` });
// The list is multi-select, where aria-selected means chosen. The highlight is the option the box points at.
const highlighted = (page: Page) =>
  page.getByRole("option").and(page.locator("[data-highlighted]"));

async function startEditing(page: Page, key = "Enter") {
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await field(page).focus();
  await page.keyboard.press(key);
  await expect(box(page)).toBeFocused();
}

for (const key of ["Enter", "Space"]) {
  test(`${key} on the field starts editing`, async ({ page }) => {
    await startEditing(page, key);
    await expect(chip(page, "Docusign")).toBeVisible();
  });
}

test("arrows move through the suggestions and loop", async ({ page }) => {
  await startEditing(page);
  await page.keyboard.type("a");
  const options = page.getByRole("option");
  const count = await options.count();
  expect(count).toBeGreaterThan(1);
  const first = (await highlighted(page).textContent())?.trim();
  await expect(box(page)).toHaveAttribute(
    "aria-activedescendant",
    (await highlighted(page).getAttribute("id")) ?? "",
  );
  await page.keyboard.press("ArrowDown");
  await expect(highlighted(page)).not.toHaveText(first ?? "");
  await page.keyboard.press("ArrowUp");
  await expect(highlighted(page)).toHaveText(first ?? "");
  await page.keyboard.press("ArrowUp");
  await expect(highlighted(page)).toHaveText((await options.last().textContent()) ?? "");
});

// An overflow:hidden parent cut the list off while it sat inside the field.
test("the suggestions open in a portal, outside the field", async ({ page }) => {
  await startEditing(page);
  await page.keyboard.type("a");
  await expect(page.getByRole("listbox", { name: "Tools" })).toBeVisible();
  const fieldRoot = box(page).locator("xpath=ancestor::*[@role='presentation'][1]");
  await expect(fieldRoot.getByRole("listbox")).toHaveCount(0);
});

test("Enter adds the highlighted suggestion, then on an empty box stops editing", async ({
  page,
}) => {
  await startEditing(page);
  await page.keyboard.type("air");
  await expect(highlighted(page)).toContainText("Airtable");
  await page.keyboard.press("Enter");
  await expect(chip(page, "Airtable")).toBeVisible();
  await expect(box(page)).toBeFocused();
  await expect(box(page)).toHaveValue("");
  await expect(page.getByRole("status").filter({ hasText: "Airtable" })).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(box(page)).toHaveCount(0);
  await expect(field(page)).toBeFocused();
  await expect(field(page)).toHaveAccessibleName(/Airtable/);
});

test("a comma adds the highlighted suggestion", async ({ page }) => {
  await startEditing(page);
  await page.keyboard.type("zap");
  await page.keyboard.press(",");
  await expect(chip(page, "Zapier")).toBeVisible();
  await expect(box(page)).toHaveValue("");
});

test("Tab with text adds the suggestion and stays in the box", async ({ page }) => {
  await startEditing(page);
  await page.keyboard.type("supa");
  await page.keyboard.press("Tab");
  await expect(chip(page, "Supabase")).toBeVisible();
  await expect(box(page)).toBeFocused();
});

test("Backspace on an empty box removes the last tag", async ({ page }) => {
  await startEditing(page);
  await page.keyboard.press("Backspace");
  await expect(chip(page, "SharePoint")).toHaveCount(0);
  await expect(chip(page, "Docusign")).toBeVisible();
  await expect(box(page)).toBeFocused();
});

test("arrows walk from the box onto the tags and back", async ({ page }) => {
  await startEditing(page);
  await page.keyboard.press("ArrowLeft");
  await expect(chip(page, "SharePoint")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(chip(page, "Docusign")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(chip(page, "SharePoint")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(box(page)).toBeFocused();
});

for (const key of ["Backspace", "Delete", "Enter", "Space"]) {
  test(`${key} on a tag removes it and focus moves to the next`, async ({ page }) => {
    await startEditing(page);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(chip(page, "Docusign")).toBeFocused();
    await page.keyboard.press(key);
    await expect(chip(page, "Docusign")).toHaveCount(0);
    await expect(chip(page, "SharePoint")).toBeFocused();
    await page.keyboard.press(key);
    await expect(chip(page, "SharePoint")).toHaveCount(0);
    await expect(box(page)).toBeFocused();
  });
}

test("Esc on a tag goes back to the box", async ({ page }) => {
  await startEditing(page);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Escape");
  await expect(box(page)).toBeFocused();
});

test("Esc in the box clears the text, then stops editing and returns focus", async ({ page }) => {
  await startEditing(page);
  await page.keyboard.type("qui");
  await page.keyboard.press("Escape");
  await expect(box(page)).toHaveValue("");
  await expect(box(page)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(box(page)).toHaveCount(0);
  await expect(field(page)).toBeFocused();
  await expect(field(page)).toHaveAccessibleName("Tools: Docusign, SharePoint");
});
