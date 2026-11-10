import { expect, test, type Locator, type Page } from "@playwright/test";

/*
 * The deck on /slides by keyboard, as the slide-deck entry in site/src/lib/a11y-notes.ts states
 * it: keys only from focus inside the deck, arrows and Home and End move, O opens the overview,
 * arrows walk its tiles, Enter opens one, Esc closes it and hands focus back, P opens the presenter.
 */

test.beforeEach(() => {
  test.skip(test.info().project.name !== "1280-light", "keyboard specs run at 1280 light only");
});
test.use({ actionTimeout: 3000 });

async function openDeck(page: Page): Promise<{ deck: Locator; progress: Locator; of: number }> {
  await page.goto("/slides", { waitUntil: "networkidle" });
  const deck = page.getByRole("region", { name: "Slides demo" });
  const progress = deck.getByRole("progressbar", { name: "Deck progress" });
  await expect(progress).toHaveAttribute("aria-valuenow", "1");
  const of = Number(await progress.getAttribute("aria-valuemax"));
  expect(of).toBeGreaterThan(3);
  return { deck, progress, of };
}

/** Presses `key` until the deck reaches slide `n`: a slide with steps takes a press per step. */
async function pressTo(page: Page, progress: Locator, key: string, n: number): Promise<void> {
  for (let i = 0; i < 8; i++) {
    if ((await progress.getAttribute("aria-valuenow")) === String(n)) return;
    await page.keyboard.press(key);
  }
  await expect(progress).toHaveAttribute("aria-valuenow", String(n));
}

test("the deck hears keys only from focus inside it", async ({ page }) => {
  const { deck, progress } = await openDeck(page);
  await page.getByRole("heading", { level: 1 }).first().click();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("End");
  await expect(progress).toHaveAttribute("aria-valuenow", "1");

  await deck.focus();
  await expect(deck).toBeFocused();
  await page.keyboard.press("End");
  await expect(progress).not.toHaveAttribute("aria-valuenow", "1");
});

test("arrows, page keys, Space, Home and End move through the deck", async ({ page }) => {
  const { deck, progress, of } = await openDeck(page);
  await deck.focus();

  await pressTo(page, progress, "ArrowRight", 2);
  await expect(deck.getByText("Slide 2 of", { exact: false })).toHaveText(`Slide 2 of ${of}`);
  await pressTo(page, progress, "PageDown", 3);
  await pressTo(page, progress, " ", 4);
  await pressTo(page, progress, "ArrowLeft", 3);
  await pressTo(page, progress, "PageUp", 2);
  await pressTo(page, progress, "Shift+Space", 1);

  await page.keyboard.press("End");
  await expect(progress).toHaveAttribute("aria-valuenow", String(of));
  await page.keyboard.press("Home");
  await expect(progress).toHaveAttribute("aria-valuenow", "1");
  await expect(deck).toBeFocused();
});

test("the controls are one Tab stop that arrows move along", async ({ page }) => {
  const { deck, progress } = await openDeck(page);
  const controls = deck.getByRole("toolbar");
  const overview = controls.getByRole("button", { name: "Slide overview" });

  // Previous is disabled on the first slide, so Next is the toolbar's stop.
  await controls.getByRole("button", { name: "Next slide" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(overview).toBeFocused();
  // The arrow moved focus along the toolbar, not the deck to the next slide.
  await expect(progress).toHaveAttribute("aria-valuenow", "1");
  await expect(overview).toHaveAttribute("aria-pressed", "false");

  await page.keyboard.press("Enter");
  await expect(overview).toHaveAttribute("aria-pressed", "true");
});

test("O opens the overview, arrows walk the tiles, Enter opens one", async ({ page }) => {
  const { deck, progress, of } = await openDeck(page);
  await deck.focus();
  await page.keyboard.press("o");

  const tiles = deck.getByRole("button", { name: new RegExp(`^Slide \\d+ of ${of}`) });
  await expect(tiles).toHaveCount(of);
  const first = deck.getByRole("button", { name: new RegExp(`^Slide 1 of ${of}`) });
  await expect(first).toBeFocused();
  await expect(first).toHaveAttribute("aria-current", "step");

  await page.keyboard.press("ArrowRight");
  await expect(deck.getByRole("button", { name: new RegExp(`^Slide 2 of ${of}`) })).toBeFocused();

  // ArrowDown moves a whole row: the tile it lands on sits right under the one it left.
  const from = await deck.locator(":focus").boundingBox();
  await page.keyboard.press("ArrowDown");
  const below = page.locator(":focus");
  await expect(below).not.toHaveAccessibleName(new RegExp(`^Slide 2 of ${of}`));
  const to = await below.boundingBox();
  expect(Math.round(to?.x ?? -1)).toBe(Math.round(from?.x ?? -2));
  expect(to?.y ?? 0).toBeGreaterThan(from?.y ?? 0);
  const n = Number((await below.getAttribute("aria-label"))?.match(/^Slide (\d+)/)?.[1]);

  await page.keyboard.press("ArrowUp");
  await expect(deck.getByRole("button", { name: new RegExp(`^Slide 2 of ${of}`) })).toBeFocused();
  await page.keyboard.press("ArrowDown");

  await page.keyboard.press("Enter");
  await expect(tiles).toHaveCount(0);
  await expect(progress).toHaveAttribute("aria-valuenow", String(n));
  await expect(deck).toBeFocused();
});

test("Esc and O close the overview and hand focus back to the deck", async ({ page }) => {
  const { deck, progress, of } = await openDeck(page);
  await deck.focus();
  const tiles = deck.getByRole("button", { name: new RegExp(`^Slide \\d+ of ${of}`) });

  await page.keyboard.press("o");
  await expect(tiles).toHaveCount(of);
  await page.keyboard.press("End");
  await expect(tiles.last()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(tiles).toHaveCount(0);
  await expect(deck).toBeFocused();
  // Esc leaves the slide where it was; only Enter picks a tile.
  await expect(progress).toHaveAttribute("aria-valuenow", "1");

  await page.keyboard.press("o");
  await expect(tiles).toHaveCount(of);
  await page.keyboard.press("o");
  await expect(tiles).toHaveCount(0);
  await expect(deck).toBeFocused();
});

test("P opens the presenter view and F asks for fullscreen", async ({ page }) => {
  const { deck } = await openDeck(page);
  await deck.focus();

  const popup = page.waitForEvent("popup");
  await page.keyboard.press("p");
  const presenter = await popup;
  await expect(presenter).toHaveURL(/\/slides\/presenter$/);
  await presenter.close();

  await deck.focus();
  await page.keyboard.press("f");
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement?.getAttribute("aria-label") ?? ""))
    .toBe("Slides demo");
  await page.keyboard.press("f");
  await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
});
