import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import Overlays from "#src/shadcn/sheet/close-label.test.svelte";
import SecretInput from "#src/shadcn/input/secret-input.svelte";

// A French app's Assistant panel announced "Close" (TSK-2735): each built-in label takes a prop.
function closeNames(closeLabel?: string): string[] {
  const app = mount(Overlays, { target: document.body, props: closeLabel ? { closeLabel } : {} });
  flushSync();
  const names = [
    ...document.querySelectorAll(
      '[data-slot="sheet-close"], [data-slot="dialog-close"], [data-slot="dialog-footer"] button',
    ),
  ].map((b) => b.textContent?.trim() ?? "");
  void unmount(app);
  return names;
}

describe("built-in close buttons", () => {
  it("say Close by default", () => {
    expect(closeNames()).toEqual(["Close", "Close", "Close"]);
  });

  it("say the caller's closeLabel", () => {
    expect(closeNames("Fermer")).toEqual(["Fermer", "Fermer", "Fermer"]);
  });
});

describe("SecretInput", () => {
  it("names its reveal button in the caller's words", () => {
    const target = document.createElement("div");
    const app = mount(SecretInput, {
      target,
      props: { revealLabel: "Afficher", hideLabel: "Masquer" },
    });
    flushSync();
    const button = target.querySelector("button");
    expect(button?.getAttribute("aria-label")).toBe("Afficher");
    button?.click();
    flushSync();
    expect(button?.getAttribute("aria-label")).toBe("Masquer");
    void unmount(app);
  });
});
