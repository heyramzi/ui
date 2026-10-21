// Table geometry: column widths, and the height that follows.
// One owner, because the component, node-sizing and board-doc must agree.
// Flat numbers stay in metrics.ts.

/** 13px Satoshi. Deliberately wide: guessing narrow leaves a gap. */
const CELL_CHAR_W = 6.7;
/** px-3 on both sides of a cell. */
export const TABLE_CELL_PAD_X = 12;
/** One line of a cell: 13px over leading-[18px]. */
const ROW_LINE_H = 18;
/** The hairline between two rows. */
const ROW_BORDER = 1;
/** The "no rows configured" placeholder. */
const TABLE_EMPTY_H = 56;
/** A section band: 11px caps over a 16px line + py-1.5 + border. */
const SECTION_ROW_H = 29;
/** A note under a row: 11px over a 16px line. */
const NOTE_LINE_H = 16;
/** Indent of the first cell per depth step. */
export const TABLE_DEPTH_INDENT = 16;

// The table card's own rhythm.
/** Title row: 24px icon chip + py-3 + border. */
export const TABLE_TITLE_H = 49;
/** Column heads: 16px line + py-2 + border. */
export const TABLE_COLHEAD_H = 33;
/** py-2.5 top and bottom. */
const TABLE_ROW_PAD_Y = 20;
/** The narrowest a table card gets, however little it says. */
export const TABLE_MIN_W = 360;
/** The widest it gets, so a 13px line stays under about 75 characters. */
export const TABLE_MAX_W = 760;
/** A column left blank to be filled in still gets room to write. */
const FILL_COL_CH = 32;

/** Excalifont runs about 12% wider than Satoshi over the same text. */
const HAND_FONT_FACTOR = 1.12;
/** The widest a drag may make a card. */
export const TABLE_RESIZE_MAX_W = 1600;

/** The floor. Under 9 characters a head like "Price" wraps. */
const MIN_COL_CH = 9;
/** The ceiling, so one long column cannot eat the card. */
const MAX_COL_CH = 48;

/**
 * One row. `section` is a full-width label from `cells[0]`, `depth` indents the
 * first cell, and `note` is a small italic line under the row.
 */
export type TableRow = { cells: string[]; section?: boolean; depth?: number; note?: string };

export function tableColumnCount(headers: string[], rows: TableRow[]): number {
  return Math.max(
    headers.length,
    rows.reduce((max, row) => Math.max(max, row.cells?.length ?? 0), 0),
    1,
  );
}

/** Fractions summing to 1. `explicit` is relative, so [1,1,3] and [10,10,30]
 *  are one split. Otherwise the content decides. */
export function tableColumnWeights(
  headers: string[],
  rows: TableRow[],
  explicit?: number[],
): number[] {
  const count = tableColumnCount(headers, rows);

  if (explicit && explicit.length === count && explicit.every((w) => w > 0)) {
    return normalize(explicit);
  }

  return normalize(naturalColumnChars(headers, rows, count));
}

/** Characters each column wants: its longest line, between the floor and the ceiling. */
function naturalColumnChars(headers: string[], rows: TableRow[], count: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const head = headers[i]?.length ?? 0;
    const cells = rows.filter((row) => !row.section).map((row) => row.cells?.[i] ?? "");
    const body = cells.reduce((max, cell) => Math.max(max, cell.length), 0);
    // "...", "…" or nothing: the column is a blank to write in, not content.
    const blank = cells.length > 0 && cells.every(isBlankCell);
    const wants = blank ? Math.max(head, FILL_COL_CH) : Math.max(head, body);
    return Math.min(MAX_COL_CH, Math.max(MIN_COL_CH, wants));
  });
}

/** A placeholder rather than a value: empty, dots, an ellipsis, a dash or a question mark. */
export function isBlankCell(value: string): boolean {
  return /^[\s.…?\-–—_]*$/.test(value);
}

/** The narrowest a column gets: enough for a head like "Price" not to wrap. */
export const TABLE_COL_MIN_W = MIN_COL_CH * CELL_CHAR_W + TABLE_CELL_PAD_X * 2;

/** `minmax(floor, …fr)`, not a bare `fr`: a long cell must not widen its column,
 *  and a thin weight must not squeeze a head below the floor. */
export function tableGridTemplate(weights: number[], floor = 0): string {
  const min = floor > 0 ? `${floor}px` : "0";
  return weights.map((w) => `minmax(${min}, ${w.toFixed(4)}fr)`).join(" ");
}

/** Pixel widths for weights, with columns under the floor pinned there, as the grid does. */
export function tableColumnPx(weights: number[], width: number): number[] {
  const out = weights.map(() => 0);
  const pinned = new Set<number>();
  let changed = true;
  while (changed) {
    changed = false;
    const free = weights.reduce((sum, w, i) => sum + (pinned.has(i) ? 0 : w), 0);
    const room = width - pinned.size * TABLE_COL_MIN_W;
    weights.forEach((w, i) => {
      if (pinned.has(i)) return;
      out[i] = free > 0 ? (room * w) / free : 0;
      if (out[i] < TABLE_COL_MIN_W && pinned.size < weights.length - 1) {
        pinned.add(i);
        changed = true;
      }
    });
  }
  return out.map((px, i) => (pinned.has(i) ? TABLE_COL_MIN_W : px));
}

/** How the card is set: the hand font is wider than the plain one. */
export type TableFont = "plain" | "hand";

function charWidth(font: TableFont): number {
  return font === "hand" ? CELL_CHAR_W * HAND_FONT_FACTOR : CELL_CHAR_W;
}

/** The width that fits the content, clamped to TABLE_MIN_W..TABLE_MAX_W and
 *  never past `ceiling`. A card the user resized keeps that width instead. */
export function tableWidth(
  headers: string[],
  rows: TableRow[],
  ceiling = TABLE_MAX_W,
  font: TableFont = "plain",
): number {
  const fitted = Math.ceil(naturalWidth(headers, rows, font));
  return Math.min(ceiling, TABLE_MAX_W, Math.max(TABLE_MIN_W, fitted));
}

/** The narrowest a drag may make a card: every column at its floor. */
export function tableMinWidth(headers: string[], rows: TableRow[]): number {
  return tableColumnCount(headers, rows) * TABLE_COL_MIN_W + 2;
}

/** The width at which every column holds its longest line, up to the per-column cap. */
function naturalWidth(headers: string[], rows: TableRow[], font: TableFont): number {
  const count = tableColumnCount(headers, rows);
  return naturalColumnChars(headers, rows, count).reduce(
    (sum, ch) => sum + ch * charWidth(font) + TABLE_CELL_PAD_X * 2,
    0,
  );
}

/** The author's weights and how the card is set, for `tableWeightsAt`. */
export type TableWeightsOptions = { explicit?: number[]; font?: TableFont };

/** Column weights for a card `width` wide. A card with room for the content
 *  splits by content; a squeezed one falls back to the author's weights. */
export function tableWeightsAt(
  headers: string[],
  rows: TableRow[],
  width: number,
  { explicit, font = "plain" }: TableWeightsOptions = {},
): number[] {
  if (width >= naturalWidth(headers, rows, font)) return tableColumnWeights(headers, rows);
  return tableColumnWeights(headers, rows, explicit);
}

/** Figure columns get `tabular-nums`. Not right-aligned: a table node is read
 *  across, and a right-aligned middle column opens a gutter mid-sentence. */
export function tableNumericColumns(rows: TableRow[], count: number): boolean[] {
  return Array.from({ length: count }, (_, i) => {
    const values = rows
      .filter((row) => !row.section)
      .map((row) => row.cells?.[i]?.trim() ?? "")
      .filter(Boolean);
    return values.length > 0 && values.every(isFigure);
  });
}

/** A price, a count, a percentage, a multiplier. Not "$20 a month". */
function isFigure(value: string): boolean {
  return /^[-+]?[$€£]?\s?\d[\d\s.,]*\s?[%x×]?$/.test(value);
}

/** How many lines a cell takes at the width its column gets. */
function wrappedLines(text: string, columnWidth: number, charW = CELL_CHAR_W): number {
  const inner = Math.max(charW, columnWidth - TABLE_CELL_PAD_X * 2);
  const perLine = Math.max(1, Math.floor(inner / charW));
  return Math.max(1, Math.ceil(text.length / perLine));
}

/** What a user has fixed by hand. Anything left out is the content's call. */
export type TableSizing = {
  /** The card's width, set by a drag on its edge. */
  userWidth?: number;
  /** px per column. Once set it is the source of truth for the split. */
  columnWidths?: number[];
  /** Min px per row; null leaves the row to its content. */
  rowHeights?: (number | null)[];
  /** The card's min height, set by a drag on its bottom edge. */
  userHeight?: number;
  font?: TableFont;
};

/** What fixes the columns: the user's sizing, and the author's weights as the fallback split. */
export type TableColumnsOptions = { sizing: TableSizing; weights?: number[] };

/** Pixel widths of the columns when the card is `width` wide. */
export function tableColumnsAt(
  headers: string[],
  rows: TableRow[],
  width: number,
  { sizing, weights }: TableColumnsOptions,
): number[] {
  const count = tableColumnCount(headers, rows);
  const inner = Math.max(count * TABLE_COL_MIN_W, width - 2);
  const pinned = sizing.columnWidths;
  if (pinned && pinned.length === count && pinned.every((w) => w > 0)) {
    return tableColumnPx(pinned, inner);
  }
  const split =
    sizing.userWidth != null
      ? tableColumnWeights(headers, rows, weights)
      : tableWeightsAt(headers, rows, width, { explicit: weights, font: sizing.font });
  return tableColumnPx(split, inner);
}

/** The card's width and the pixel width of each column, from what the user fixed. */
export function tableColumns(
  headers: string[],
  rows: TableRow[],
  sizing: TableSizing = {},
  weights?: number[],
): { width: number; columns: number[] } {
  const count = tableColumnCount(headers, rows);
  const pinned = sizing.columnWidths;
  const hasPinned = pinned && pinned.length === count && pinned.every((w) => w > 0);
  const width =
    sizing.userWidth ??
    (hasPinned
      ? Math.round(pinned.reduce((sum, w) => sum + w, 0)) + 2
      : tableWidth(headers, rows, TABLE_MAX_W, sizing.font));
  return { width, columns: tableColumnsAt(headers, rows, width, { sizing, weights }) };
}

/** Each row's height: its content, or the height the user pinned if that is more. */
export function tableRowHeights(
  rows: TableRow[],
  columns: number[],
  sizing: Pick<TableSizing, "rowHeights" | "font"> = {},
): number[] {
  const charW = charWidth(sizing.font ?? "plain");
  const full = columns.reduce((sum, px) => sum + px, 0);
  return rows.map((row, i) => {
    if (row.section) return Math.max(SECTION_ROW_H, sizing.rowHeights?.[i] ?? 0);
    const indent = (row.depth ?? 0) * TABLE_DEPTH_INDENT;
    const lines = columns.reduce(
      (max, px, c) =>
        Math.max(max, wrappedLines(row.cells?.[c] ?? "", c === 0 ? px - indent : px, charW)),
      1,
    );
    const note = row.note ? wrappedLines(row.note, full - indent) * NOTE_LINE_H : 0;
    const content = TABLE_ROW_PAD_Y + lines * ROW_LINE_H + ROW_BORDER + note;
    return Math.max(content, sizing.rowHeights?.[i] ?? 0);
  });
}

/** The author's weights and what the user fixed, for `tableHeight`. */
export type TableHeightOptions = { explicit?: number[]; sizing?: TableSizing };

/** The card's height at a given width, wrapping included. A height the user set is a floor. */
export function tableHeight(
  headers: string[],
  rows: TableRow[],
  width: number,
  { explicit, sizing = {} }: TableHeightOptions = {},
): number {
  const head = headers.length > 0 ? TABLE_COLHEAD_H : 0;
  if (rows.length === 0) return TABLE_TITLE_H + head + TABLE_EMPTY_H;

  const columns = tableColumnsAt(headers, rows, width, { sizing, weights: explicit });
  const body = tableRowHeights(rows, columns, sizing).reduce((sum, h) => sum + h, 0);
  return Math.max(sizing.userHeight ?? 0, TABLE_TITLE_H + head + body);
}

/** The width a column needs to hold its longest line, for a double-click on its border. */
export function tableColumnFit(
  headers: string[],
  rows: TableRow[],
  col: number,
  font: TableFont = "plain",
): number {
  const longest = [
    headers[col] ?? "",
    ...rows.filter((row) => !row.section).map((row) => row.cells?.[col] ?? ""),
  ].reduce((max, text) => Math.max(max, text.length), 0);
  const px = Math.ceil(longest * charWidth(font)) + TABLE_CELL_PAD_X * 2;
  return Math.max(TABLE_COL_MIN_W, Math.min(px, TABLE_RESIZE_MAX_W));
}

function normalize(weights: number[]): number[] {
  const total = weights.reduce((sum, w) => sum + w, 0);
  return total > 0 ? weights.map((w) => w / total) : weights.map(() => 1 / weights.length);
}
