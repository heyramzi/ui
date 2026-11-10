import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it, vi } from "vite-plus/test";
import AiButton, { type AiStatus } from "#src/ai/ai-button/AiButton.svelte";

// 10 Nov 2026: the button turned disabled while it worked, and focus dropped to the page.
describe("AiButton while processing", () => {
  for (const iconOnly of [false, true]) {
    it(`keeps focus and ignores presses${iconOnly ? " (icon only)" : ""}`, () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      const onclick = vi.fn();
      const props = $state({ status: "idle" as AiStatus, onclick, iconOnly });
      const app = mount(AiButton, { target, props });
      flushSync();
      const button = target.querySelector("button");
      button?.focus();
      props.status = "processing";
      flushSync();
      expect(document.activeElement).toBe(button);
      expect(button?.getAttribute("aria-disabled")).toBe("true");
      button?.click();
      expect(onclick).not.toHaveBeenCalled();
      void unmount(app);
      target.remove();
    });
  }
});
