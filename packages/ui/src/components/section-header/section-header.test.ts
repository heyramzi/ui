import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import SectionHeader from "#src/components/section-header/section-header.svelte";

function render(props: Record<string, unknown>) {
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(SectionHeader, { target, props: { title: "Lines", ...props } });
  flushSync();
  return { target, done: () => { void unmount(app); target.remove(); } };
}

describe("SectionHeader", () => {
  it("draws the count as a chip a screen reader can name", () => {
    const { target, done } = render({ count: 3, countLabel: "lines" });
    expect(target.querySelector("[aria-label='3 lines']")).not.toBeNull();
    done();
  });

  it("takes its heading level", () => {
    const { target, done } = render({ level: 3 });
    expect(target.querySelector("h3")).not.toBeNull();
    done();
  });
});
