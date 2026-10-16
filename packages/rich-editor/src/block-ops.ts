// WHY: pure, server-safe block edits. No DB, HTTP or DOM, and every op returns
// a new doc without touching the input.

// Top-level blocks must carry `id` attrs. An unknown id throws.

import { markdownToTiptap } from "./markdown.js";

// =========================
// TYPES
// =========================

type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

export type TiptapDoc = {
  type: "doc";
  content: TiptapNode[];
};

export type BlockSummary = {
  id: string;
  type: string;
  text: string;
};

// =========================
// HELPERS
// =========================

function extractText(nodes: TiptapNode[] | undefined): string {
  if (!nodes?.length) return "";
  return nodes
    .map((n) => {
      if (n.type === "text") return n.text ?? "";
      if (n.type === "hardBreak") return " ";
      return extractText(n.content);
    })
    .join("");
}

function blockText(node: TiptapNode): string {
  // For list nodes, join item texts separated by spaces.
  const raw = extractText(node.content).trim();
  // Truncate for preview.
  return raw.length > 120 ? raw.slice(0, 117) + "..." : raw;
}

function getId(node: TiptapNode): string | null {
  const id = node.attrs?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function requireDoc(doc: unknown): TiptapDoc {
  const d = doc as TiptapDoc;
  if (!d || d.type !== "doc" || !Array.isArray(d.content)) {
    throw new Error("Invalid doc: expected { type: 'doc', content: [...] }");
  }
  return d;
}

function requireBlockById(doc: TiptapDoc, id: string): number {
  const idx = doc.content.findIndex((n) => getId(n) === id);
  if (idx === -1) {
    throw new Error(`Block id "${id}" not found in doc`);
  }
  return idx;
}

function newBlocksFromMd(markdown: string): TiptapNode[] {
  const parsed = markdownToTiptap(markdown);
  return parsed.content;
}

// =========================
// PUBLIC OPS
// =========================

/**
 * Return a flat list of top-level blocks with id, type, and plain-text preview.
 */
export function listBlocks(doc: unknown): BlockSummary[] {
  const d = requireDoc(doc);
  return d.content.map((node) => ({
    id: getId(node) ?? "",
    type: node.type,
    text: blockText(node),
  }));
}

/**
 * Append blocks parsed from `markdown` after the last block.
 * Returns a new doc.
 */
export function appendBlocks(doc: unknown, markdown: string): TiptapDoc {
  const d = requireDoc(doc);
  const added = newBlocksFromMd(markdown);
  return {
    type: "doc",
    content: [...d.content, ...added],
  };
}

/**
 * Prepend blocks parsed from `markdown` before the first block.
 * Returns a new doc.
 */
export function prependBlocks(doc: unknown, markdown: string): TiptapDoc {
  const d = requireDoc(doc);
  const added = newBlocksFromMd(markdown);
  return {
    type: "doc",
    content: [...added, ...d.content],
  };
}

/**
 * Insert blocks parsed from `markdown` immediately after the block with `afterId`.
 * Throws if `afterId` does not exist.
 * Returns a new doc.
 */
export function insertBlocksAfter(doc: unknown, afterId: string, markdown: string): TiptapDoc {
  const d = requireDoc(doc);
  const idx = requireBlockById(d, afterId);
  const added = newBlocksFromMd(markdown);
  const content = [...d.content.slice(0, idx + 1), ...added, ...d.content.slice(idx + 1)];
  return { type: "doc", content };
}

/**
 * Replace the block with `id` with blocks parsed from `markdown`.
 * Throws if `id` does not exist.
 * Returns a new doc.
 */
export function replaceBlock(doc: unknown, id: string, markdown: string): TiptapDoc {
  const d = requireDoc(doc);
  const idx = requireBlockById(d, id);
  const added = newBlocksFromMd(markdown);
  const content = [...d.content.slice(0, idx), ...added, ...d.content.slice(idx + 1)];
  return { type: "doc", content };
}

/**
 * Delete the block with `id`.
 * Throws if `id` does not exist.
 * Returns a new doc.
 */
export function deleteBlock(doc: unknown, id: string): TiptapDoc {
  const d = requireDoc(doc);
  const idx = requireBlockById(d, id);
  const content = [...d.content.slice(0, idx), ...d.content.slice(idx + 1)];
  return { type: "doc", content };
}
