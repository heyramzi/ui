/**
 * Launches Chromium, falling back to the installed Chrome. The bundled
 * Chromium goes missing after a Playwright bump, and Chrome prints the same.
 * Pass `chromium` from Playwright.
 */
export async function launchChromium<B>(chromium: {
  launch(options?: { headless?: boolean; channel?: string }): Promise<B>;
}): Promise<B> {
  return chromium
    .launch({ headless: true })
    .catch(() => chromium.launch({ headless: true, channel: "chrome" }));
}
