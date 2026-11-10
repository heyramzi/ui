import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it, vi } from "vite-plus/test";
import Flow from "#src/ai/confirmation/confirmation-focus.test.svelte";

// 10 Nov 2026: focus dropped to the page after Delete, and the box turned live in the same update as its result.
describe("Confirmation after an action", () => {
  it("keeps focus through the run and moves it to the live box once resolved", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    const onDelete = vi.fn();
    const app = mount(Flow, { target, props: { onDelete } });
    flushSync();
    const section = target.querySelector("section");
    const button = target.querySelector("button");
    expect(section?.getAttribute("aria-live")).toBe("polite");

    button?.focus();
    button?.click();
    flushSync();
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(button);
    expect(button?.disabled).toBe(false);
    button?.click();
    expect(onDelete).toHaveBeenCalledTimes(1);

    app.resolve();
    flushSync();
    expect(section?.textContent?.trim()).toBe("Deleted.");
    expect(document.activeElement).toBe(section);

    void unmount(app);
    target.remove();
  });
});
