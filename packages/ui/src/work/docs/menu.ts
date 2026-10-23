/**
 * The `…` menu as data: which items exist, which show, how a filter reads them and
 * which keys fire them. The component only draws what this returns.
 */
import { tiptapToMarkdown } from "#src/editor/markdown.js";
import type { DocLabels } from "#src/work/docs/labels.js";

export type MenuId =
  | "move"
  | "duplicate"
  | "rename"
  | "template"
  | "favorite"
  | "copy"
  | "remind"
  | "history"
  | "delete";

export type Shortcut = { key: string; shift?: boolean; alt?: boolean };

export type MenuItem = {
  id: MenuId;
  label: string;
  shortcut?: Shortcut;
  /** Opens a second list instead of firing. */
  submenu?: boolean;
  danger?: boolean;
  /** Items in one group sit together; a hairline separates groups. */
  group: number;
};

export const SHORTCUTS: Partial<Record<MenuId, Shortcut>> = {
  move: { key: "P", shift: true },
  rename: { key: "R", shift: true },
  favorite: { key: "F", alt: true },
  remind: { key: "H", shift: true },
};

/** "⇧P", "⌥F". */
export function shortcutLabel(shortcut: Shortcut): string {
  return `${shortcut.shift ? "⇧" : ""}${shortcut.alt ? "⌥" : ""}${shortcut.key.toUpperCase()}`;
}

/** Which callbacks the host passed. An item with no callback never shows. */
export type MenuAvailable = Partial<Record<MenuId, boolean>>;

export function menuItems(
  available: MenuAvailable,
  labels: DocLabels,
  options: { favorited?: boolean } = {},
): MenuItem[] {
  const all: MenuItem[] = [
    { id: "move", label: labels.moveTo, group: 0 },
    { id: "duplicate", label: labels.duplicate, group: 0 },
    { id: "rename", label: labels.rename, group: 0 },
    { id: "template", label: labels.template, group: 0 },
    { id: "favorite", label: options.favorited ? labels.unfavorite : labels.favorite, group: 1 },
    { id: "copy", label: labels.copy, submenu: true, group: 1 },
    { id: "remind", label: labels.remind, group: 1 },
    { id: "history", label: labels.history, group: 2 },
    { id: "delete", label: labels.delete, danger: true, group: 2 },
  ];
  return all
    .filter((item) => available[item.id])
    .map((item) => Object.assign(item, { shortcut: SHORTCUTS[item.id] }));
}

/** Case-insensitive, every typed word must appear. An empty query keeps everything. */
export function filterMenu<T extends { label: string }>(items: T[], query: string): T[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return items;
  return items.filter((item) => {
    const label = item.label.toLowerCase();
    return words.every((word) => label.includes(word));
  });
}

/** The item a key press fires, or null. `code` is the physical key, since Option+F types "ƒ". */
export function shortcutTarget(
  event: { code: string; shiftKey: boolean; altKey: boolean; metaKey: boolean; ctrlKey: boolean },
  items: MenuItem[],
): MenuId | null {
  if (event.metaKey || event.ctrlKey) return null;
  const hit = items.find(
    (item) =>
      item.shortcut &&
      event.code === `Key${item.shortcut.key.toUpperCase()}` &&
      !!item.shortcut.shift === event.shiftKey &&
      !!item.shortcut.alt === event.altKey,
  );
  return hit?.id ?? null;
}

export type CopyKind = "url" | "title" | "link" | "markdown";

export type CopyOption = { kind: CopyKind; label: string; text: string };

/** The Copy submenu. A kind with nothing to copy is left out: no URL, no content. */
export function copyOptions(
  source: { title: string; url?: string; content?: unknown },
  labels: DocLabels,
): CopyOption[] {
  const title = source.title.trim() || labels.untitled;
  const options: CopyOption[] = [];
  if (source.url) options.push({ kind: "url", label: labels.copyUrl, text: source.url });
  options.push({ kind: "title", label: labels.copyTitle, text: title });
  if (source.url) {
    options.push({
      kind: "link",
      label: labels.copyTitleAsLink,
      text: `[${title.replace(/([[\]\\])/g, "\\$1")}](${source.url})`,
    });
  }
  if (source.content) {
    options.push({
      kind: "markdown",
      label: labels.copyMarkdown,
      text: tiptapToMarkdown(source.content),
    });
  }
  return options;
}

/** What the delete confirm calls the doc. */
export function deleteName(title: string, labels: DocLabels): string {
  return title.trim() || labels.untitled;
}
