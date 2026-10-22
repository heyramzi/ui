import { createRawSnippet, flushSync, mount, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import TableView from "#src/components/table-view/table-view.svelte";

type Row = { id: string; name: string; total: number };
const rows: Row[] = [
  { id: "a", name: "Audit", total: 1200 },
  { id: "b", name: "Build", total: 4800 },
];

function render(extra: Record<string, unknown> = {}) {
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(TableView<Row>, {
    target,
    props: {
      label: "Lines",
      rows,
      rowKey: (row: Row) => row.id,
      columns: [
        { key: "name", label: "Name" },
        { key: "total", label: "Total", numeric: true, format: (v: unknown) => `$${v}` },
      ],
      ...extra,
    },
  });
  flushSync();
  return {
    target,
    done: () => {
      void unmount(app);
      target.remove();
    },
  };
}

describe("TableView", () => {
  it("names the table and prints each row through its column's format", () => {
    const { target, done } = render();
    expect(target.querySelector("table")?.getAttribute("aria-label")).toBe("Lines");
    const cells = [...target.querySelectorAll("tbody td")].map((td) => td.textContent?.trim());
    expect(cells).toEqual(["Audit", "$1200", "Build", "$4800"]);
    done();
  });

  it("right-aligns a numeric column and draws a footer in the same columns", () => {
    const { target, done } = render({ footer: { id: "t", name: "Total", total: 6000 } });
    expect(target.querySelector("thead th:last-child")?.className).toContain("text-end");
    expect(target.querySelector("tfoot")?.textContent).toContain("$6000");
    done();
  });

  it("lets a caller draw a cell", () => {
    const cell = createRawSnippet(() => ({ render: () => `<b>x</b>` }));
    const { target, done } = render({ cell });
    expect(target.querySelectorAll("tbody b").length).toBe(4);
    done();
  });
});
