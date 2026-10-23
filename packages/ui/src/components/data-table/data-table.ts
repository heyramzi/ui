import type { Snippet } from "svelte";

export type DataTableFilter<T> = (row: T, query: string) => boolean;

export type DataTableEmptyState = {
  title: string;
  description: string;
  searchDescription?: string;
  action?: Snippet;
};

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function containsQuery(value: string | null | undefined, query: string): boolean {
  if (!query) return true;

  return value?.toLowerCase().includes(query) ?? false;
}

export function anyContainsQuery(values: Array<string | null | undefined>, query: string): boolean {
  return values.some((value) => containsQuery(value, query));
}

// ========================= TYPES
export type SortDirection = "asc" | "desc";

export type SortState<T> = {
  key: keyof T & string;
  direction: SortDirection;
} | null;

// ========================= FUNCTIONS
export function toggleSort<T>(current: SortState<T>, key: keyof T & string): SortState<T> {
  if (current?.key !== key) return { key, direction: "asc" };
  if (current.direction === "asc") return { key, direction: "desc" };
  return null;
}

export function sortRows<T>(rows: T[], sort: SortState<T>): T[] {
  if (!sort) return rows;
  const { key, direction } = sort;
  const multiplier = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (typeof aVal === "string" && typeof bVal === "string") {
      return multiplier * aVal.localeCompare(bVal);
    }
    if (typeof aVal === "number" && typeof bVal === "number") {
      return multiplier * (aVal - bVal);
    }
    return multiplier * String(aVal).localeCompare(String(bVal));
  });
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function formatCount(visible: number, total: number, label: string): string {
  const singular = label.endsWith("s") ? label.slice(0, -1) : label;
  // The noun agrees with the total: "0 of 1 item", not "0 of 1 items".
  const noun = total === 1 ? singular : label;
  if (visible === total) return `${total.toLocaleString()} ${noun}`;
  return `${visible.toLocaleString()} of ${total.toLocaleString()} ${noun}`;
}
