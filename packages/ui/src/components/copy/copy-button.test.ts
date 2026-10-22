import { flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import CopyButton from "#src/components/copy/copy-button.svelte";

type Props = { value: string; [key: string]: unknown };

// jsdom ships no clipboard, so the write is stubbed and asserted on directly.
function stubClipboard(result: Promise<void> = Promise.resolve()) {
  const writeText = vi.fn().mockReturnValue(result);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  return writeText;
}

function render(props: Props) {
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(CopyButton, { target, props });
  flushSync();
  const button = target.querySelector("button");
  if (!button) throw new Error("CopyButton rendered no button");
  return {
    button,
    target,
    done: () => {
      void unmount(app);
      target.remove();
    },
  };
}

async function click(button: HTMLButtonElement) {
  button.click();
  await vi.advanceTimersByTimeAsync(0);
  flushSync();
}

describe("CopyButton", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("puts the value on the clipboard", async () => {
    const writeText = stubClipboard();
    const { button, done } = render({ value: "26011200", text: "26011200" });
    await click(button);
    expect(writeText).toHaveBeenCalledWith("26011200");
    done();
  });

  it("names what it copies, so the button is not just a value", () => {
    stubClipboard();
    const { button, done } = render({
      value: "abc123",
      text: "abc123",
      label: "Copy API key abc123",
    });
    expect(button.getAttribute("aria-label")).toBe("Copy API key abc123");
    done();
  });

  it("announces in a live region by default and keeps its name", async () => {
    stubClipboard();
    const { button, target, done } = render({
      value: "x",
      label: "Copy id",
      copiedLabel: "Copied",
    });
    await click(button);
    expect(target.querySelector("[aria-live]")?.textContent).toBe("Copied");
    expect(button.getAttribute("aria-label")).toBe("Copy id");
    done();
  });

  // A page of 500 codes would read as a wall of live regions, so the name carries it.
  it("announce name: no live region, the accessible name says it copied, then rests", async () => {
    stubClipboard();
    const { button, target, done } = render({
      value: "25070080",
      text: "25070080",
      label: "Copy CN code 25070080",
      copiedLabel: "CN code 25070080 copied",
      announce: "name",
    });
    expect(target.querySelector("[aria-live]")).toBeNull();
    await click(button);
    expect(button.getAttribute("aria-label")).toBe("CN code 25070080 copied");
    await vi.advanceTimersByTimeAsync(1500);
    flushSync();
    expect(button.getAttribute("aria-label")).toBe("Copy CN code 25070080");
    done();
  });

  it("calls onCopied after a write that landed", async () => {
    stubClipboard();
    const onCopied = vi.fn();
    const { button, done } = render({ value: "x", onCopied });
    await click(button);
    expect(onCopied).toHaveBeenCalledOnce();
    done();
  });

  it("keeps the resting state when the browser refuses the clipboard", async () => {
    const writeText = stubClipboard(Promise.reject(new Error("denied")));
    const onCopied = vi.fn();
    const { button, done } = render({
      value: "x",
      label: "Copy x",
      copiedLabel: "x copied",
      announce: "name",
      onCopied,
    });
    await click(button);
    expect(writeText).toHaveBeenCalled();
    expect(button.getAttribute("aria-label")).toBe("Copy x");
    expect(onCopied).not.toHaveBeenCalled();
    done();
  });
});
