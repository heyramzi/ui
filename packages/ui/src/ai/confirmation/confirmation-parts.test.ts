import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import type { ConfirmationKind } from "#src/ai/confirmation/index.js";
import Parts from "#src/ai/confirmation/confirmation-parts.test.svelte";

function shown(kind: ConfirmationKind): string {
  const target = document.createElement("div");
  const app = mount(Parts, { target, props: { kind } });
  flushSync();
  const text = target.textContent?.replace(/\s+/g, " ").trim() ?? "";
  void unmount(app);
  return text;
}

describe("ConfirmationState", () => {
  it("shows only the part whose `when` matches the kind", () => {
    expect(shown("requested")).toBe("request");
    expect(shown("accepted")).toBe("accepted");
    expect(shown("rejected")).toBe("rejected");
    expect(shown("failed")).toBe("failed");
    expect(shown("idle")).toBe("");
  });
});
