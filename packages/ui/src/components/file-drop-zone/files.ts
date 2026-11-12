/** Why a file didn't make it into the list. */
export type RejectReason = "type" | "size" | "count";

export interface Rejection {
  file: File;
  reason: RejectReason;
}

export interface CheckOptions {
  /** The input's `accept` string: extensions (`.pdf`), MIME types (`application/pdf`) or groups (`image/*`). */
  accept?: string;
  /** Largest file, in bytes. */
  maxFileSize?: number;
  /** Most files the list holds. */
  maxFiles?: number;
  /** Without it, a new file replaces the one already there. */
  multiple?: boolean;
}

export type FileKind = "pdf" | "image" | "csv" | "sheet" | "other";

const tokens = (accept: string | undefined) =>
  (accept ?? "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

/** Whether a file passes the `accept` string, the way the browser's picker reads it. */
export function matchesAccept(file: File, accept: string | undefined): boolean {
  const list = tokens(accept);
  if (list.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return list.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

// The same file picked twice is one file: name, size and date match.
const same = (a: File, b: File) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

/**
 * Sorts what came in (a drop, a paste or the picker) into the next list and what got turned away.
 * Type is checked first, then size, then room left, so a file is refused for its first fault.
 */
export function checkFiles(
  incoming: readonly File[],
  current: readonly File[],
  { accept, maxFileSize, maxFiles, multiple = false }: CheckOptions,
): { files: File[]; accepted: File[]; rejected: Rejection[] } {
  const room = multiple ? (maxFiles ?? Infinity) : 1;
  const kept = multiple ? [...current] : [];
  const accepted: File[] = [];
  const rejected: Rejection[] = [];
  for (const file of incoming) {
    if (!matchesAccept(file, accept)) rejected.push({ file, reason: "type" });
    else if (maxFileSize !== undefined && file.size > maxFileSize)
      rejected.push({ file, reason: "size" });
    else if (kept.some((other) => same(other, file))) continue;
    else if (kept.length >= room) rejected.push({ file, reason: "count" });
    else {
      kept.push(file);
      accepted.push(file);
    }
  }
  return { files: accepted.length > 0 || multiple ? kept : [...current], accepted, rejected };
}

/** Drops one file from the list. */
export const removeFile = (files: readonly File[], file: File): File[] =>
  files.filter((other) => other !== file);

const UNITS = ["o", "Ko", "Mo", "Go"] as const;

/** A byte count the way a French reader says it: "820 o", "12 Ko", "1,4 Mo". */
export function formatSize(bytes: number, locale = "fr-FR"): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 || value >= 10 ? 0 : 1;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
  return `${number} ${UNITS[unit]}`;
}

const GROUPS: Record<string, string> = {
  "image/": "Images",
  "audio/": "Audio",
  "video/": "Vidéos",
  "text/": "Texte",
};

const MIME_NAMES: Record<string, string> = {
  "application/pdf": "PDF",
  "text/csv": "CSV",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/zip": "ZIP",
  "application/json": "JSON",
};

/** The `accept` string as a reader names it: ".pdf,application/pdf" is "PDF", "image/*" is "Images". */
export function describeAccept(accept: string | undefined): string {
  const names: string[] = [];
  for (const token of tokens(accept)) {
    const name = token.startsWith(".")
      ? token.slice(1).toUpperCase()
      : token.endsWith("/*")
        ? (GROUPS[token.slice(0, -1)] ?? token)
        : (MIME_NAMES[token] ?? token.split("/").pop()?.toUpperCase() ?? token);
    if (name === "JPEG" && names.includes("JPG")) continue;
    if (!names.includes(name)) names.push(name);
  }
  return names.join(", ");
}

/** The muted line under the title: "PDF, 10 Mo maximum". Empty when nothing limits the pick. */
export function describeLimits(
  accept: string | undefined,
  maxFileSize: number | undefined,
): string {
  const types = describeAccept(accept);
  const size = maxFileSize === undefined ? "" : `${formatSize(maxFileSize)} maximum`;
  return [types, size].filter(Boolean).join(", ");
}

/** Which icon a file gets. */
export function fileKind(file: File): FileKind {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (type.startsWith("image/")) return "image";
  if (type === "text/csv" || name.endsWith(".csv")) return "csv";
  if (/\.(xlsx?|ods)$/.test(name) || type.includes("spreadsheet") || type.includes("excel"))
    return "sheet";
  return "other";
}
