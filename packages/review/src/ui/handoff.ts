import type { App } from "#src/hooks/app.svelte.js";

/** The page can't edit the script itself, so it asks the agent on the other end to. */
export function askForScript(app: App): void {
  app.review.act({
    type: "note",
    target: { kind: "video" },
    text: "I'm happy with every decision on this page. Edit the script to match: apply every kept beat, drop every skipped one, and tell me when it's done.",
    chat: true,
  });
}
