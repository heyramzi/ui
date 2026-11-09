import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import TypingDots, { type TypingDotsProps } from "#src/ai/typing-dots/TypingDots.svelte";

function render(props: TypingDotsProps): HTMLElement {
  const target = document.createElement("div");
  const app = mount(TypingDots, { target, props });
  flushSync();
  const root = target.firstElementChild as HTMLElement;
  void unmount(app);
  return root;
}

describe("TypingDots", () => {
  it("is three hidden dots with no label", () => {
    const root = render({});
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.getAttribute("role")).toBeNull();
    expect(root.querySelectorAll(".typing-dot")).toHaveLength(3);
  });

  it("becomes a status line with its text when labelled", () => {
    const root = render({ label: "Thinking", class: "extra" });
    expect(root.getAttribute("role")).toBe("status");
    expect(root.textContent?.trim()).toBe("Thinking");
    expect(root.classList.contains("extra")).toBe(true);
    expect(root.querySelector(".typing-dots")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("keeps the status role and the caller's aria-label for an empty label", () => {
    const root = render({ label: "", "aria-label": "Thinking" });
    expect(root.getAttribute("role")).toBe("status");
    expect(root.getAttribute("aria-label")).toBe("Thinking");
    expect(root.textContent?.trim()).toBe("");
  });
});
