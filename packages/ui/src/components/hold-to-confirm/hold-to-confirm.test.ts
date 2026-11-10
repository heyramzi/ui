import { createRawSnippet, flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import HoldToConfirm from "#src/components/hold-to-confirm/hold-to-confirm.svelte";

const text = (label: string) => createRawSnippet(() => ({ render: () => `<span>${label}</span>` }));

function render(duration = 800) {
  const onConfirm = vi.fn();
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(HoldToConfirm, {
    target,
    props: { duration, onConfirm, idle: text("Hold to delete"), holding: text("Deleting") },
  });
  flushSync();
  const button = target.querySelector("button");
  if (!button) throw new Error("HoldToConfirm rendered no button");
  const key = (type: "keydown" | "keyup", k: string, repeat = false) => {
    button.dispatchEvent(new KeyboardEvent(type, { key: k, repeat, bubbles: true }));
    flushSync();
  };
  return {
    button,
    onConfirm,
    key,
    done: () => {
      void unmount(app);
      target.remove();
    },
  };
}

// The OS repeats keydown about every 33ms while a key is held. The 10 Nov audit saw Space stall at 6%.
async function holdWithRepeat(key: ReturnType<typeof render>["key"], k: string, ms: number) {
  key("keydown", k);
  for (let t = 33; t <= ms; t += 33) {
    await vi.advanceTimersByTimeAsync(33);
    key("keydown", k, true);
  }
}

describe("HoldToConfirm keyboard", () => {
  beforeEach(() =>
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "setTimeout"],
    }),
  );
  afterEach(() => vi.useRealTimers());

  for (const k of [" ", "Enter"]) {
    it(`confirms when ${k === " " ? "Space" : k} is held through key repeat`, async () => {
      const { onConfirm, key, done } = render();
      await holdWithRepeat(key, k, 900);
      expect(onConfirm).toHaveBeenCalledTimes(1);
      key("keyup", k);
      done();
    });
  }

  it("cancels when the key is let go early", async () => {
    const { button, onConfirm, key, done } = render();
    await holdWithRepeat(key, " ", 400);
    key("keyup", " ");
    await vi.advanceTimersByTimeAsync(800);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(button.dataset.holding).toBe("false");
    done();
  });

  // 10 Nov 2026: a screen reader's activate presses and lets go at once, so the hold never completed.
  it("arms on an assistive-tech click and confirms on a second one", async () => {
    const { button, onConfirm, done } = render();
    const status = button.parentElement?.querySelector('[role="status"]');
    expect(status?.textContent).toBe("");
    button.dispatchEvent(new MouseEvent("click", { detail: 0, bubbles: true }));
    flushSync();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(status?.textContent).toBe("Press again to confirm");
    button.dispatchEvent(new MouseEvent("click", { detail: 0, bubbles: true }));
    flushSync();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    done();
  });

  it("lets the armed state lapse and ignores pointer clicks", async () => {
    const { button, onConfirm, done } = render();
    button.dispatchEvent(new MouseEvent("click", { detail: 0, bubbles: true }));
    await vi.advanceTimersByTimeAsync(6000);
    button.dispatchEvent(new MouseEvent("click", { detail: 0, bubbles: true }));
    button.dispatchEvent(new MouseEvent("click", { detail: 1, bubbles: true }));
    flushSync();
    expect(onConfirm).not.toHaveBeenCalled();
    done();
  });

  it("cancels when focus leaves mid-hold", async () => {
    const { button, onConfirm, key, done } = render();
    await holdWithRepeat(key, "Enter", 300);
    button.dispatchEvent(new FocusEvent("blur"));
    flushSync();
    await vi.advanceTimersByTimeAsync(800);
    expect(onConfirm).not.toHaveBeenCalled();
    done();
  });
});
