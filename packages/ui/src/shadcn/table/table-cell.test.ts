import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import TableCell from "#src/shadcn/table/table-cell.svelte";

describe("TableCell", () => {
  // A column of dates or prices has to line up whoever writes the cell.
  it("keeps digits one width", () => {
    const target = document.createElement("tr");
    document.body.appendChild(target);
    const app = mount(TableCell, { target, props: {} });
    flushSync();
    expect(target.querySelector("td")?.className).toContain("tabular-nums");
    void unmount(app);
    target.remove();
  });
});
