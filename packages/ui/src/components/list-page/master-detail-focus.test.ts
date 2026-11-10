import { createRawSnippet, flushSync, mount, tick, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import MasterDetail from "#src/components/list-page/master-detail.svelte";

const rail = createRawSnippet(() => ({
  render: () => `<div><button>Ada</button><button aria-current="page">Grace</button></div>`,
}));
const detail = createRawSnippet(() => ({ render: () => `<p>Grace's record</p>` }));

describe("MasterDetail focus while stacked", () => {
  it("puts focus back on the list's current row when Back is pressed", async () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    const app = mount(MasterDetail, { target, props: { rail, detail, pane: "detail" } });
    flushSync();

    const back = [...target.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "Back to the list",
    );
    back?.focus();
    back?.click();
    for (let i = 0; i < 3; i++) await tick();

    expect(document.activeElement?.textContent).toBe("Grace");
    void unmount(app);
    target.remove();
  });
});
