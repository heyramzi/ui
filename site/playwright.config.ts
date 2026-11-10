import { execFileSync } from "node:child_process";
import { defineConfig } from "@playwright/test";

// The site owns 3100-3109 and the dev server holds 3101, so take the first free port from 3102.
// Workers inherit it through the env and never pick another.
const probe = `
const net = require("node:net");
const next = (p) => {
  if (p > 3109) process.exit(1);
  const s = net.createServer();
  s.once("error", () => next(p + 1));
  s.listen(p, "127.0.0.1", () => s.close(() => process.stdout.write(String(p))));
};
next(3102);`;
process.env.GALLERY_PORT ??= execFileSync(process.execPath, ["-e", probe], { encoding: "utf8" });
const baseURL = `http://127.0.0.1:${process.env.GALLERY_PORT}`;

// 390 is a phone: touch, no hover, so the coarse-pointer styles are the ones under test.
const widths = [
  { width: 390, height: 844, phone: true },
  { width: 1280, height: 900, phone: false },
];
const themes = ["light", "dark"] as const;

export default defineConfig({
  testDir: "e2e",
  // Not *.spec.ts: the site's `vp test run` would collect a spec file and call Playwright's test().
  testMatch: "*.e2e.ts",
  outputDir: "e2e/results",
  // One baseline per project, no platform suffix: baselines come from Linux only (see e2e/README.md).
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // 3 workers held 1.6 GB on the Mac and the swap brake stopped them; CI's heavy runner has 4.5 GB.
  workers: process.env.CI ? 3 : 2,
  timeout: 90_000,
  // CI never writes a baseline it was meant to compare against.
  updateSnapshots: process.env.CI ? "none" : "missing",
  reporter: process.env.CI
    ? [["dot"], ["github"], ["html", { open: "never", outputFolder: "e2e/report" }]]
    : [["dot"], ["html", { open: "never", outputFolder: "e2e/report" }]],
  globalTeardown: "./e2e/axe-record.ts",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      maxDiffPixelRatio: 0.002,
    },
  },
  use: {
    baseURL,
    reducedMotion: "reduce",
    timezoneId: "UTC",
    locale: "en-US",
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
  },
  projects: widths.flatMap(({ width, height, phone }) =>
    themes.map((theme) => ({
      name: `${width}-${theme}`,
      use: {
        viewport: { width, height },
        colorScheme: theme,
        isMobile: phone,
        hasTouch: phone,
      },
    })),
  ),
  webServer: {
    command: "node e2e/serve.mjs",
    url: `${baseURL}/sitemap.xml`,
    reuseExistingServer: false,
    stdout: "ignore",
  },
});
