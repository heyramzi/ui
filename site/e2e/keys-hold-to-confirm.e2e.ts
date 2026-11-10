import { expect, test } from "@playwright/test";

// Keyboard behaviour from the hold-to-confirm entry in src/lib/a11y-notes.ts (TSK-2205, TSK-2310).
test.beforeEach(() => {
  test.skip(test.info().project.name !== "1280-light", "keyboard specs run at 1280 light only");
});
test.use({ actionTimeout: 3000 });

const PAGE = "/components/hold-to-confirm";

async function open(page: import("@playwright/test").Page) {
  await page.goto(PAGE, { waitUntil: "networkidle" });
  // The name follows the fill, so one locator matches both labels.
  const button = page.getByRole("button", { name: /^(Hold to delete|Keep holding)$/ });
  await button.focus();
  await expect(button).toBeFocused();
  return button;
}

for (const key of ["Space", "Enter"]) {
  test(`holding ${key} fills the button and confirms`, async ({ page }) => {
    const button = await open(page);
    await page.keyboard.down(key);
    await expect(button).toHaveAccessibleName("Keep holding");
    await expect(button).toHaveAttribute("data-holding", "true");
    await expect(page.getByText("Deleted.")).toBeVisible({ timeout: 3000 });
    await page.keyboard.up(key);
    await expect(button).toHaveAccessibleName("Hold to delete");
    await expect(button).toBeFocused();
  });

  test(`letting ${key} go early cancels`, async ({ page }) => {
    const button = await open(page);
    await page.keyboard.down(key);
    await page.waitForTimeout(250);
    await page.keyboard.up(key);
    await expect(button).toHaveAccessibleName("Hold to delete");
    await page.waitForTimeout(900);
    await expect(page.getByText("Deleted.")).toHaveCount(0);
  });
}

test("focus leaving the button mid-hold cancels", async ({ page }) => {
  const button = await open(page);
  await page.keyboard.down("Space");
  await expect(button).toHaveAttribute("data-holding", "true");
  await button.evaluate((el) => el.blur());
  await expect(button).toHaveAttribute("data-holding", "false");
  await page.waitForTimeout(1000);
  await page.keyboard.up("Space");
  await expect(page.getByText("Deleted.")).toHaveCount(0);
});

test("a key repeat does not restart the fill", async ({ page }) => {
  const button = await open(page);
  await page.keyboard.down("Space");
  // Auto-repeat sends further keydowns with repeat set; the fill keeps its clock and still lands.
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(100);
    await button.dispatchEvent("keydown", { key: " ", code: "Space", repeat: true, bubbles: true });
  }
  await expect(page.getByText("Deleted.")).toBeVisible({ timeout: 3000 });
  await page.keyboard.up("Space");
});

test("a screen reader's activate arms, a second activate confirms", async ({ page }) => {
  const button = await open(page);
  // Assistive tech sends a bare click with detail 0.
  await button.evaluate((el) =>
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 0 })),
  );
  await expect(page.getByRole("status").filter({ hasText: "Press again to confirm" })).toHaveCount(
    1,
  );
  await expect(page.getByText("Deleted.")).toHaveCount(0);
  await button.evaluate((el) =>
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 0 })),
  );
  await expect(page.getByText("Deleted.")).toBeVisible();
});
