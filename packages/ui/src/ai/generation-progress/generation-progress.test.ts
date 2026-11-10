import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import GenerationProgress from "#src/ai/generation-progress/GenerationProgress.svelte";

// The 10 Nov audit: no progressbar role and nothing live, so a screen reader heard no step and no failure.
describe("GenerationProgress", () => {
  it("is a progressbar with a value, and its step is said in a live region", () => {
    const target = document.createElement("div");
    const props = {
      status: "generating" as const,
      progress: { completed: 2, total: 5, currentStep: "Writing the summary" },
    };
    const app = mount(GenerationProgress, { target, props });
    flushSync();
    const bar = target.querySelector("[role=progressbar]");
    expect(bar?.getAttribute("aria-label")).toBe("Generating");
    expect(bar?.getAttribute("aria-valuenow")).toBe("2");
    expect(bar?.getAttribute("aria-valuemax")).toBe("5");
    expect(bar?.getAttribute("aria-valuetext")).toBe("2 of 5");
    expect(target.querySelector("[role=status]")?.textContent).toBe(
      "Generating: Writing the summary",
    );
    void unmount(app);
  });

  it("keeps the live region while idle and says a failure in it", () => {
    const target = document.createElement("div");
    const idle = mount(GenerationProgress, { target, props: { status: "idle" } });
    flushSync();
    expect(target.querySelector("[role=status]")?.textContent).toBe("");
    void unmount(idle);
    const failed = mount(GenerationProgress, { target, props: { status: "failed" } });
    flushSync();
    expect(target.querySelector("[role=status]")?.textContent).toBe("Generation failed");
    void unmount(failed);
  });
});
