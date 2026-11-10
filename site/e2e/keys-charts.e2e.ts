import { expect, test } from "@playwright/test";

/*
 * Charts by keyboard, as site/src/lib/a11y-notes.ts states them: Tab reaches the plot, the arrows,
 * Home and End step a point and read it out, and Esc clears it. A Legend row is no Tab stop: only
 * a hover on it drives the ring chart beside it.
 */

test.beforeEach(() => {
  test.skip(test.info().project.name !== "1280-light", "keyboard specs run at 1280 light only");
});
test.use({ actionTimeout: 3000 });

test("the line chart steps its points by keyboard", async ({ page }) => {
  await page.goto("/components/line-chart", { waitUntil: "networkidle" });
  const plot = page.getByRole("application", { name: "Line chart" }).first();
  await expect(plot).toHaveAttribute("tabindex", "0");
  await plot.focus();
  await expect(plot).toBeFocused();

  // The live region beside the plot reads the point the keys land on.
  const live = plot.locator("xpath=following-sibling::p[@aria-live='polite'][1]");
  await expect(live).toHaveText("");

  await page.keyboard.press("ArrowRight");
  await expect(live).toHaveText("Mon: Visits 1,240, Signups 120");
  await page.keyboard.press("ArrowRight");
  await expect(live).toHaveText(/^Tue: Visits 1,480/);
  await page.keyboard.press("ArrowLeft");
  await expect(live).toHaveText(/^Mon: /);
  await page.keyboard.press("End");
  await expect(live).toHaveText(/^Sun: Visits 1,950/);
  // The last point holds: a step past the end stays put.
  await page.keyboard.press("ArrowDown");
  await expect(live).toHaveText(/^Sun: /);
  await page.keyboard.press("Home");
  await expect(live).toHaveText(/^Mon: /);
  await page.keyboard.press("ArrowUp");
  await expect(live).toHaveText(/^Mon: /);

  await page.keyboard.press("Escape");
  await expect(live).toHaveText("");
  await expect(plot).toBeFocused();
});

test("a hovered legend row drives the ring chart, and the legend takes no focus", async ({
  page,
}) => {
  await page.goto("/components/chart-variants", { waitUntil: "networkidle" });
  const ring = page.getByRole("img", { name: /^Sessions: / });
  await expect(ring).toBeVisible();
  const centre = ring.getByText("Sessions", { exact: true });
  await expect(centre).toBeVisible();

  // The first Legend on the page is the one bound to the ring; the second stands on its own.
  // Its rows are plain list items: hover only highlights, so they are no Tab stop.
  const legend = page.getByRole("list").filter({ hasText: "Organic" }).first();
  await expect(legend.getByRole("button")).toHaveCount(0);
  const organic = legend.getByRole("listitem").filter({ hasText: "Organic" });
  const paid = legend.getByRole("listitem").filter({ hasText: "Paid" });

  await organic.hover();
  // The ring's centre names the hovered row in place of its default label, and the others dim.
  await expect(ring.getByText("Organic", { exact: true })).toBeVisible();
  await expect(centre).toBeHidden();
  await expect(paid).toHaveCSS("opacity", "0.4");
  await expect(organic).toHaveCSS("opacity", "1");

  await paid.hover();
  await expect(ring.getByText("Paid", { exact: true })).toBeVisible();
  await expect(organic).toHaveCSS("opacity", "0.4");
  await expect(paid).toHaveCSS("opacity", "1");

  // The pointer leaving the legend clears the highlight.
  await page.mouse.move(0, 0);
  await expect(centre).toBeVisible();
  await expect(organic).toHaveCSS("opacity", "1");
});
