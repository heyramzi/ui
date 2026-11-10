import { existsSync } from "node:fs";
import { join } from "node:path";
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { compareAxe, readAllowlist, recordObserved, recording } from "./axe.ts";
import { galleryPages, pageSlug } from "./pages.ts";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const allowlist = readAllowlist();

/**
 * Pixels compare on Linux only, since the baselines are CI renders. A project without a baseline
 * folder yet is skipped; once it exists, a page missing its baseline fails.
 */
function shouldShoot(project: string, update: string): boolean {
  if (process.platform !== "linux") return false;
  return update !== "none" || existsSync(join(import.meta.dirname, "__screenshots__", project));
}

test.beforeEach(async ({ page }) => {
  // Demos that draw dates or random data render the same on every run.
  await page.clock.setFixedTime(new Date("2026-06-15T12:00:00Z"));
  await page.addInitScript(() => {
    let seed = 42;
    Math.random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  });
});

for (const path of galleryPages()) {
  test(path, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`console: ${msg.text()} (${msg.location().url})`);
    });
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status(), `${path} answered`).toBe(200);
    await page.evaluate(() => document.fonts.ready);

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    if (recording) {
      recordObserved(info, path, [...new Set(violations.map((v) => v.id))]);
    } else {
      const { unexpected, stale } = compareAxe(path, info.project.name, violations, allowlist);
      expect.soft(unexpected, "axe").toBe("");
      expect.soft(stale, "axe allowlist").toBe("");
    }
    if (violations.length) {
      const body = JSON.stringify(violations, null, 2);
      await info.attach("axe", { body, contentType: "application/json" });
    }

    if (shouldShoot(info.project.name, info.config.updateSnapshots)) {
      await expect.soft(page).toHaveScreenshot(`${pageSlug(path)}.png`, {
        fullPage: true,
        // WebGL and video frames never land on the same pixel twice.
        mask: [page.locator("canvas, video")],
      });
    } else {
      info.annotations.push({
        type: "screenshot",
        description: "not compared off Linux or before baselines exist",
      });
    }

    expect(errors, "console and page errors").toEqual([]);
  });
}
