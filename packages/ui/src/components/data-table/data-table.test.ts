import { describe, expect, it } from "vite-plus/test";
import {
  toggleSort,
  sortRows,
  paginateRows,
  totalPages,
  normalizeQuery,
  containsQuery,
  anyContainsQuery,
  formatCount,
} from "#src/components/data-table/data-table.js";

type Item = { name: string; value: number; date: string | null };

const items: Item[] = [
  { name: "Charlie", value: 3, date: "2025-03-01" },
  { name: "Alice", value: 1, date: "2025-01-01" },
  { name: "Bob", value: 2, date: null },
];

describe("toggleSort", () => {
  it("returns asc when no current sort", () => {
    expect(toggleSort<Item>(null, "name")).toEqual({ key: "name", direction: "asc" });
  });

  it("returns desc when current is asc on same key", () => {
    expect(toggleSort<Item>({ key: "name", direction: "asc" }, "name")).toEqual({
      key: "name",
      direction: "desc",
    });
  });

  it("returns null when current is desc on same key", () => {
    expect(toggleSort<Item>({ key: "name", direction: "desc" }, "name")).toBeNull();
  });

  it("returns asc on new key", () => {
    expect(toggleSort<Item>({ key: "name", direction: "desc" }, "value")).toEqual({
      key: "value",
      direction: "asc",
    });
  });
});

describe("sortRows", () => {
  it("returns same order when sort is null", () => {
    expect(sortRows(items, null)).toEqual(items);
  });

  it("sorts strings ascending", () => {
    const sorted = sortRows(items, { key: "name", direction: "asc" });
    expect(sorted.map((i) => i.name)).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("sorts strings descending", () => {
    const sorted = sortRows(items, { key: "name", direction: "desc" });
    expect(sorted.map((i) => i.name)).toEqual(["Charlie", "Bob", "Alice"]);
  });

  it("sorts numbers ascending", () => {
    const sorted = sortRows(items, { key: "value", direction: "asc" });
    expect(sorted.map((i) => i.value)).toEqual([1, 2, 3]);
  });

  it("pushes nulls to end", () => {
    const sorted = sortRows(items, { key: "date", direction: "asc" });
    expect(sorted[2].date).toBeNull();
  });

  it("does not mutate original array", () => {
    const original = [...items];
    sortRows(items, { key: "name", direction: "asc" });
    expect(items).toEqual(original);
  });
});

describe("paginateRows", () => {
  const rows = Array.from({ length: 25 }, (_, i) => ({ id: i }));

  it("returns first page", () => {
    const result = paginateRows(rows, 1, 10);
    expect(result).toHaveLength(10);
    expect(result[0].id).toBe(0);
  });

  it("returns last partial page", () => {
    const result = paginateRows(rows, 3, 10);
    expect(result).toHaveLength(5);
    expect(result[0].id).toBe(20);
  });

  it("returns empty for out-of-range page", () => {
    expect(paginateRows(rows, 5, 10)).toHaveLength(0);
  });
});

describe("totalPages", () => {
  it("calculates correct total", () => {
    expect(totalPages(25, 10)).toBe(3);
    expect(totalPages(20, 10)).toBe(2);
    expect(totalPages(0, 10)).toBe(1);
  });
});

describe("formatCount", () => {
  it("shows total when no filter active", () => {
    expect(formatCount(10, 10, "items")).toBe("10 items");
  });
  it("shows filtered of total when filtered", () => {
    expect(formatCount(3, 10, "items")).toBe("3 of 10 items");
  });
  it("singularizes when count is 1", () => {
    expect(formatCount(1, 1, "items")).toBe("1 item");
  });
  it("singularizes filtered count", () => {
    expect(formatCount(1, 10, "items")).toBe("1 of 10 items");
  });
});

describe("existing utilities", () => {
  it("normalizeQuery trims and lowercases", () => {
    expect(normalizeQuery("  Hello  ")).toBe("hello");
  });

  it("containsQuery handles null", () => {
    expect(containsQuery(null, "test")).toBe(false);
    expect(containsQuery("testing", "test")).toBe(true);
  });

  it("anyContainsQuery matches any value", () => {
    expect(anyContainsQuery(["foo", null, "bar"], "bar")).toBe(true);
    expect(anyContainsQuery(["foo", null], "bar")).toBe(false);
  });
});
