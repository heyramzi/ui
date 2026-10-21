// Pure edits on a screen's parts, so the card and the CLI op change a screen the same way.
// Each function returns a new list.

import {
  MAX_LABEL,
  MAX_LIST_ITEMS,
  MAX_PARTS,
  PART_DEFAULTS,
  PART_KINDS,
  SCREEN_MODES,
  SCREEN_NODE,
  SCREEN_WIDTH,
  type PartKind,
  type ScreenData,
  type ScreenPart,
} from "#src/canvas/screen/types.js";

const isKind = (value: unknown): value is PartKind =>
  typeof value === "string" && (PART_KINDS as readonly string[]).includes(value);

const text = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value.slice(0, MAX_LABEL) : fallback;

/** The next id no part of this screen holds: p1, p2, and so on. */
export function nextPartId(parts: readonly ScreenPart[]): string {
  const taken = new Set(parts.map((part) => part.id));
  let n = parts.length + 1;
  while (taken.has(`p${n}`)) n += 1;
  return `p${n}`;
}

/** A part of this kind with its starting words. */
export function createPart(
  kind: PartKind,
  parts: readonly ScreenPart[],
  seed: Partial<Omit<ScreenPart, "id" | "kind">> = {},
): ScreenPart {
  const base = PART_DEFAULTS[kind];
  const part: ScreenPart = { ...base, ...seed, id: nextPartId(parts), kind };
  if (part.items) part.items = [...part.items];
  return part;
}

/** A stored id kept when it is a new string, else the next free one. */
function uniquePartId(raw: unknown, parts: ScreenPart[], seen: Set<string>): string {
  const id = typeof raw === "string" && raw ? raw : "";
  const unique = !id || seen.has(id) ? nextPartId(parts) : id;
  seen.add(unique);
  return unique;
}

/** What only one kind of part carries: a list's rows, a modal's body, a button's weight. */
function kindFields(kind: PartKind, part: Record<string, unknown>): Partial<ScreenPart> {
  if (kind === "list") {
    const items = Array.isArray(part.items) ? part.items : PART_DEFAULTS.list.items;
    return { items: (items ?? []).slice(0, MAX_LIST_ITEMS).map((item) => text(item)) };
  }
  if (kind === "modal") return { text: text(part.text, PART_DEFAULTS.modal.text) };
  if (kind === "button") return { variant: part.variant === "secondary" ? "secondary" : "primary" };
  return {};
}

/** One stored part as a part that draws, or null when its kind is not one we know. */
function normalizePart(entry: unknown, parts: ScreenPart[], seen: Set<string>): ScreenPart | null {
  const part = (entry ?? {}) as Record<string, unknown>;
  if (!isKind(part.kind)) return null;
  const kind = part.kind;
  const id = uniquePartId(part.id, parts, seen);
  return {
    id,
    kind,
    label: text(part.label, PART_DEFAULTS[kind].label),
    ...kindFields(kind, part),
  };
}

/** A screen as stored may be old, hand-written or half-typed: this one always draws. */
export function normalizeScreen(data: unknown): ScreenData {
  const raw = (data ?? {}) as Record<string, unknown>;
  const seen = new Set<string>();
  const parts: ScreenPart[] = [];
  const rawParts = Array.isArray(raw.parts) ? raw.parts : [];
  for (const entry of rawParts.slice(0, MAX_PARTS)) {
    const next = normalizePart(entry, parts, seen);
    if (next) parts.push(next);
  }
  return {
    label: text(raw.label),
    mode: (SCREEN_MODES as readonly unknown[]).includes(raw.mode)
      ? (raw.mode as ScreenData["mode"])
      : "wireframe",
    parts,
  };
}

export function addPart(
  parts: readonly ScreenPart[],
  kind: PartKind,
  seed?: Partial<Omit<ScreenPart, "id" | "kind">>,
  index = parts.length,
): ScreenPart[] {
  if (parts.length >= MAX_PARTS) return [...parts];
  const at = Math.max(0, Math.min(index, parts.length));
  return [...parts.slice(0, at), createPart(kind, parts, seed), ...parts.slice(at)];
}

export function removePart(parts: readonly ScreenPart[], id: string): ScreenPart[] {
  return parts.filter((part) => part.id !== id);
}

/** One step up (-1) or down (1). The ends stay put. */
export function movePart(parts: readonly ScreenPart[], id: string, step: -1 | 1): ScreenPart[] {
  const from = parts.findIndex((part) => part.id === id);
  const to = from + step;
  if (from < 0 || to < 0 || to >= parts.length) return [...parts];
  const next = [...parts];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function patchPart(
  parts: readonly ScreenPart[],
  id: string,
  patch: Partial<Omit<ScreenPart, "id" | "kind">>,
): ScreenPart[] {
  return parts.map((part) => (part.id === id ? { ...part, ...patch } : part));
}

/** A list row's words. Rows are added and cut at the end, never reordered. */
export function setItem(items: readonly string[], index: number, value: string): string[] {
  return items.map((item, i) => (i === index ? value : item));
}

export function addItem(items: readonly string[]): string[] {
  return items.length >= MAX_LIST_ITEMS ? [...items] : [...items, "Item"];
}

export function removeItem(items: readonly string[], index: number): string[] {
  return items.filter((_, i) => i !== index);
}

/** A ready node for a board, as the CLI and the palette both build it. */
export function buildScreenNode(options: {
  id: string;
  position: { x: number; y: number };
  label?: string;
  mode?: ScreenData["mode"];
  parts?: ReadonlyArray<{ kind: PartKind } & Partial<Omit<ScreenPart, "id" | "kind">>>;
  width?: number;
}) {
  let parts: ScreenPart[] = [];
  for (const entry of options.parts ?? []) {
    const { kind, ...seed } = entry;
    parts = addPart(parts, kind, seed);
  }
  const data = normalizeScreen({ label: options.label, mode: options.mode, parts });
  return {
    id: options.id,
    type: SCREEN_NODE,
    position: options.position,
    data,
    style: { width: options.width ?? SCREEN_WIDTH },
  };
}
