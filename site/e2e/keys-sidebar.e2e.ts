import { expect, test, type Page } from "@playwright/test";

// Keyboard behaviour from the sidebar entry in src/lib/a11y-notes.ts (TSK-2205, TSK-2310).
// The demo is collapsible="none", so the rail never hides. The open state it toggles is read
// from the cookie the provider writes on every change, which is the state an app reloads with.
test.beforeEach(() => {
  test.skip(test.info().project.name !== "1280-light", "keyboard specs run at 1280 light only");
});
test.use({ actionTimeout: 3000 });

const PAGE = "/components/sidebar";

async function sidebarCookie(page: Page): Promise<string | undefined> {
  const cookies = await page.context().cookies();
  return cookies.find((c) => c.name === "sidebar:state")?.value;
}

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Home" }).first()).toBeVisible();
});

for (const chord of ["Meta+b", "Control+b"]) {
  test(`${chord} toggles the sidebar from anywhere on the page`, async ({ page }) => {
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    expect(await sidebarCookie(page)).toBeUndefined();
    await page.keyboard.press(chord);
    await expect.poll(() => sidebarCookie(page)).toBe("false");
    await page.keyboard.press(chord);
    await expect.poll(() => sidebarCookie(page)).toBe("true");
  });
}

test("the shortcut leaves typing alone in a field", async ({ page }) => {
  // A plain field on the page, the way an app's form would sit beside the sidebar.
  await page.evaluate(() => {
    const field = document.createElement("input");
    field.setAttribute("aria-label", "Scratch field");
    document.querySelector("main")?.append(field);
  });
  const field = page.getByRole("textbox", { name: "Scratch field" });
  await field.focus();
  await page.keyboard.press("ControlOrMeta+b");
  await page.keyboard.press("Control+b");
  await expect(field).toBeFocused();
  expect(await sidebarCookie(page)).toBeUndefined();
});

test("the shortcut still works after a sidebar row is used", async ({ page }) => {
  const inbox = page.getByRole("button", { name: "Inbox" }).first();
  await inbox.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Inbox", level: 3 })).toBeVisible();
  await page.keyboard.press("ControlOrMeta+b");
  await expect.poll(() => sidebarCookie(page)).toBe("false");
  await expect(inbox).toBeFocused();
});
