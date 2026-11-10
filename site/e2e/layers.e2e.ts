import { expect, test, type Locator } from "@playwright/test";

/*
 * Kit CSS sits in Tailwind's components layer, so a caller's utility on a kit part beats the
 * part's own rules. This reads what /layer-check applied.
 */

function computed(locator: Locator, ...props: string[]): Promise<Record<string, string>> {
  return locator.evaluate(
    (el, names) =>
      Object.fromEntries(names.map((n) => [n, getComputedStyle(el).getPropertyValue(n)])),
    props,
  );
}

test.beforeEach(async ({ page }) => {
  const response = await page.goto("/layer-check");
  expect(response?.status()).toBe(200);
});

test("a utility beats a kit stylesheet", async ({ page }) => {
  const { "background-color": red } = await computed(
    page.getByTestId("control"),
    "background-color",
  );
  expect(red, "the control paints").not.toBe("rgba(0, 0, 0, 0)");

  // charts/trend-pill.css sets its own background, radius and padding.
  const pill = page.getByTestId("trend-pill-wrap").locator(".hr-trend");
  expect(
    await computed(pill, "background-color", "border-top-left-radius", "padding-left"),
  ).toEqual({ "background-color": red, "border-top-left-radius": "0px", "padding-left": "24px" });

  // ai/typing-dots/TypingDots.css sets its own gap.
  const dots = page.getByTestId("typing-dots");
  expect(await computed(dots, "background-color", "column-gap")).toEqual({
    "background-color": red,
    "column-gap": "12px",
  });
});

test("a utility beats a component style block", async ({ page }) => {
  const { "background-color": red } = await computed(
    page.getByTestId("control"),
    "background-color",
  );
  const dot = page.getByTestId("time-dot-wrap").locator(".time-dot");
  expect(await computed(dot, "background-color")).toEqual({ "background-color": red });
});
