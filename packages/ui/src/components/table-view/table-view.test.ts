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

describe("TableView extensions", () => {
  const sortable = [
    { key: "name", label: "Name", sortable: true },
    { key: "total", label: "Total", numeric: true, sortable: true },
  ];

  // The 10 Nov audit: the head took focus itself with no button inside, so it wasn't announced as a control.
  it("sorts from a button in the head and sets aria-sort on the th", () => {
    const { target, done } = render({ columns: sortable, sort: { key: "name", direction: "asc" } });
    const heads = target.querySelectorAll<HTMLElement>("thead th");
    expect(heads[0].getAttribute("aria-sort")).toBe("ascending");
    expect(heads[1].getAttribute("aria-sort")).toBe("none");
    expect(heads[1].hasAttribute("tabindex")).toBe(false);
    const button = heads[1].querySelector<HTMLButtonElement>("button");
    expect(button?.textContent?.trim()).toBe("Total");
    button?.click();
    flushSync();
    expect(target.querySelectorAll("thead th")[1].getAttribute("aria-sort")).toBe("ascending");
    button?.click();
    flushSync();
    expect(target.querySelectorAll("thead th")[1].getAttribute("aria-sort")).toBe("descending");
    done();
  });

  it("draws a real link per row", () => {
    const { target, done } = render({ rowHref: (row: Row) => `/lines/${row.id}` });
    const links = [...target.querySelectorAll("tbody a")].map((a) => a.getAttribute("href"));
    expect(links).toEqual(["/lines/a", "/lines/b"]);
    expect(target.querySelector("tbody a")?.getAttribute("aria-label")).toBe("Audit");
    done();
  });

  it("selects rows and shows select-all as indeterminate", () => {
    const selected = new Set<string>(["a"]);
    const { target, done } = render({ selectable: true, selected });
    const boxes = target.querySelectorAll<HTMLElement>("[role=checkbox]");
    expect(boxes.length).toBe(3);
    expect(boxes[0].getAttribute("aria-checked")).toBe("mixed");
    expect(target.querySelectorAll("tbody tr")[0].getAttribute("data-state")).toBe("selected");
    done();
  });

  it("puts a header row over each group, spanning every column", () => {
    const { target, done } = render({ group: (row: Row) => (row.id === "a" ? "One" : "Two") });
    const heads = target.querySelectorAll("tbody th[colspan]");
    expect([...heads].map((h) => h.textContent?.trim())).toEqual(["One", "Two"]);
    expect(heads[0].getAttribute("colspan")).toBe("2");
    done();
  });

  it("swaps rows for skeletons inside the same frame while loading", () => {
    const { target, done } = render({ loading: true, skeletonRows: 3 });
    expect(target.querySelector("table")?.getAttribute("aria-busy")).toBe("true");
    expect(target.querySelectorAll("tbody tr").length).toBe(3);
    expect(target.querySelector("tbody td")?.textContent?.trim()).toBe("");
    done();
  });

  it("draws no frame of its own, bare or not", () => {
    for (const bare of [false, true]) {
      const { target, done } = render({ bare });
      const frame = (target.firstElementChild as HTMLElement).className;
      expect(frame).not.toMatch(/\b(border|ring|shadow|rounded)/);
      done();
    }
  });
});

describe("TableView row actions", () => {
  // The 10 Nov audit: a clickable row took focus as a bare tr, so a screen reader didn't call it a control.
  it("opens a row from its own named button or a click, but leaves a nested button alone", () => {
    const calls: string[] = [];
    const cell = createRawSnippet<[{ text: string }]>((cellProps) => ({
      render: () => `<span><button>${cellProps().text}</button></span>`,
    }));
    const { target, done } = render({ onRowClick: (row: Row) => calls.push(row.id), cell });
    const tr = target.querySelector("tbody tr") as HTMLElement;
    expect(tr.hasAttribute("tabindex")).toBe(false);
    const open = tr.querySelector<HTMLButtonElement>("td:last-child > button[aria-label]");
    expect(open?.getAttribute("aria-label")).toBe("Audit");
    open?.click();
    tr.click();
    (tr.querySelector("span > button") as HTMLButtonElement).click();
    expect(calls).toEqual(["a", "a"]);
    expect(target.querySelectorAll("thead th").length).toBe(3);
    done();
  });

  it("opens a row menu from Shift+F10 or the ContextMenu key on a focused row", () => {
    const rowMenu = createRawSnippet(() => ({ render: () => `<span>Rename</span>` }));
    const { target, done } = render({ rowMenu });
    const tr = target.querySelector("tbody tr") as HTMLElement;
    expect(tr.tabIndex).toBe(0);
    expect(tr.getAttribute("aria-keyshortcuts")).toBe("Shift+F10 ContextMenu");
    for (const init of [{ key: "F10", shiftKey: true }, { key: "ContextMenu" }]) {
      const opened: Event[] = [];
      tr.addEventListener("contextmenu", (event) => opened.push(event), { once: true });
      const key = new KeyboardEvent("keydown", { ...init, bubbles: true, cancelable: true });
      tr.dispatchEvent(key);
      expect(key.defaultPrevented).toBe(true);
      expect(opened.length).toBe(1);
    }
    done();
  });

  it("folds a group, hides a column below a breakpoint and shows a sub-row", () => {
    const subRow = createRawSnippet(() => ({ render: () => `<i>detail</i>` }));
    const { target, done } = render({
      group: () => "All",
      collapsible: true,
      subRow,
      expanded: (row: Row) => row.id === "a",
      columns: [
        { key: "name", label: "Name" },
        { key: "total", label: "Total", hideBelow: "md" },
      ],
    });
    expect(target.querySelector("tbody i")).not.toBeNull();
    expect(target.querySelector("thead th:last-child")?.className).toContain("md:table-cell");
    (target.querySelector("tbody th button") as HTMLButtonElement).click();
    flushSync();
    expect(target.querySelectorAll("tbody tr").length).toBe(1);
    done();
  });

  it("draws the empty snippet across the columns", () => {
    const empty = createRawSnippet(() => ({ render: () => `<p>Nothing</p>` }));
    const { target, done } = render({ rows: [], empty });
    expect(target.querySelector("tbody td")?.getAttribute("colspan")).toBe("2");
    done();
  });
});
