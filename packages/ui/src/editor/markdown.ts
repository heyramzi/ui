// markdown-it, not a hand-rolled tokenizer: CommonMark opens underscore
// emphasis only at word boundaries, so `clic_tempo_v2` is never italic. Pure
// string transformer, so it is Workers-safe. Italic serialises as `*`.

import MarkdownIt from "markdown-it";
import type { Token } from "markdown-it";
import { generateBlockId } from "#src/editor/block-id.js";
import { YOUTUBE_ID_RE, parseYoutubeUrl } from "#src/editor/youtube-url.js";

// =========================
// TYPES
// =========================

type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
};

type TiptapDoc = {
  type: "doc";
  content: TiptapNode[];
};

// =========================
// PARSER (markdown -> TipTap)
// =========================

// WHY the default preset: commonmark has no strikethrough (s_open/s_close).
// linkify: false keeps bare URLs as text. breaks: false keeps single newlines soft.
const mdi = new MarkdownIt({ breaks: false, linkify: false });

// WHY: a paragraph holding one image token with a YouTube src is the markdown
// form of a `youtube` block. It reads markdown-it's own image token, so no
// custom parser rule.
function imageTokenToYoutubeNode(tok: Token): TiptapNode | null {
  if (tok.type !== "image") return null;
  const src = String(tok.attrGet("src") ?? "");
  const parsed = parseYoutubeUrl(src);
  if (!parsed) return null;
  return {
    type: "youtube",
    attrs: { videoId: parsed.videoId, title: tok.content ?? "", start: parsed.start, id: null },
  };
}

export function markdownToTiptap(md: string): TiptapDoc {
  const tokens = mdi.parse(md.trim(), {});
  const blocks = parseTokensToBlocks(tokens);
  return { type: "doc", content: blocks };
}

// Walk the flat token array. markdown-it emits block-level open/close pairs
// at nesting level 0 in the top-level array; inline content is in token.children.
function parseTokensToBlocks(tokens: Token[]): TiptapNode[] {
  const blocks: TiptapNode[] = [];
  let i = 0;
  for (let tok = tokens[i]; tok; tok = tokens[i]) {
    const parse = Object.hasOwn(BLOCK_PARSERS, tok.type) ? BLOCK_PARSERS[tok.type] : null;
    // Unknown or unhandled tokens (html_block, etc.) are skipped.
    if (!parse) {
      i++;
      continue;
    }
    const { node, next } = parse(tokens, i, tok);
    blocks.push(stampId(node));
    i = next;
  }
  return blocks;
}

type Parsed = { node: TiptapNode; next: number };
type BlockParser = (tokens: Token[], i: number, tok: Token) => Parsed;

function inlineChildrenAt(tokens: Token[], i: number): Token[] {
  const inlineTok = tokens[i];
  return inlineTok?.type === "inline" ? (inlineTok.children ?? []) : [];
}

function orderedStart(tok: Token): number {
  const startAttr = tok.attrGet("start");
  return startAttr !== null ? parseInt(String(startAttr), 10) : 1;
}

// open + inline + close, so the next block starts three tokens on.
function parseParagraph(tokens: Token[], i: number): Parsed {
  const children = inlineChildrenAt(tokens, i + 1);
  // A lone image with a YouTube src becomes a `youtube` block.
  const [only, ...rest] = children;
  const youtube = only && !rest.length ? imageTokenToYoutubeNode(only) : null;
  const node = youtube ?? {
    type: "paragraph",
    attrs: { id: null },
    content: parseInlineChildren(children),
  };
  return { node, next: i + 3 };
}

function parseHeading(tokens: Token[], i: number, tok: Token): Parsed {
  const level = headingLevel(tok.markup);
  const content = parseInlineChildren(inlineChildrenAt(tokens, i + 1));
  return { node: { type: "heading", attrs: { level, id: null }, content }, next: i + 3 };
}

function parseFence(_tokens: Token[], i: number, tok: Token): Parsed {
  const lang = tok.info.trim() || null;
  const code = tok.content.endsWith("\n") ? tok.content.slice(0, -1) : tok.content;
  const node = {
    type: "codeBlock",
    attrs: { language: lang, id: null },
    content: code ? [{ type: "text", text: code }] : [],
  };
  return { node, next: i + 1 };
}

function parseBlockquote(tokens: Token[], i: number): Parsed {
  const { inner, next } = collectUntilClose(tokens, i + 1, "blockquote");
  const innerBlocks = parseTokensToBlocks(inner).map(stripId);
  const content = innerBlocks.length ? innerBlocks : [{ type: "paragraph", content: [] }];
  // next is the blockquote_close, which is skipped.
  return { node: { type: "blockquote", attrs: { id: null }, content }, next: next + 1 };
}

function parseBulletList(tokens: Token[], i: number): Parsed {
  const { inner, next } = collectUntilClose(tokens, i + 1, "bullet_list");
  const node = { type: "bulletList", attrs: { id: null }, content: parseListItems(inner) };
  return { node, next: next + 1 };
}

function parseOrderedList(tokens: Token[], i: number, tok: Token): Parsed {
  const start = orderedStart(tok);
  const { inner, next } = collectUntilClose(tokens, i + 1, "ordered_list");
  const node = { type: "orderedList", attrs: { id: null, start }, content: parseListItems(inner) };
  return { node, next: next + 1 };
}

const BLOCK_PARSERS: Record<string, BlockParser> = {
  paragraph_open: parseParagraph,
  heading_open: parseHeading,
  hr: (_tokens, i) => ({ node: { type: "horizontalRule", attrs: { id: null } }, next: i + 1 }),
  fence: parseFence,
  blockquote_open: parseBlockquote,
  bullet_list_open: parseBulletList,
  ordered_list_open: parseOrderedList,
};

// Collect tokens between the current position and the matching _close token.
// Returns the inner tokens (excluding open/close) and the index of the close token.
function collectUntilClose(
  tokens: Token[],
  start: number,
  type: string,
): { inner: Token[]; next: number } {
  const openType = `${type}_open`;
  const closeType = `${type}_close`;
  let depth = 1;

  for (let i = start; i < tokens.length; i++) {
    const type = tokens[i]?.type;
    if (type === openType) depth++;
    else if (type === closeType) {
      depth--;
      if (depth === 0) {
        return { inner: tokens.slice(start, i), next: i };
      }
    }
  }

  // Unclosed block: return everything remaining.
  return { inner: tokens.slice(start), next: tokens.length };
}

// Parse list_item_open ... list_item_close pairs into listItem nodes.
function parseListItems(tokens: Token[]): TiptapNode[] {
  const items: TiptapNode[] = [];
  let i = 0;

  for (let tok = tokens[i]; tok; tok = tokens[i]) {
    if (tok.type === "list_item_open") {
      const { inner, next } = collectUntilClose(tokens, i + 1, "list_item");
      items.push(parseListItemContent(inner));
      i = next + 1;
    } else {
      i++;
    }
  }

  return items;
}

// Turn a list_item's inner tokens (paragraphs and nested lists) into a listItem.
// WHY: nested nodes get no ids; only top-level blocks do.
function parseListItemContent(tokens: Token[]): TiptapNode {
  const content: TiptapNode[] = [];
  let i = 0;

  for (let tok = tokens[i]; tok; tok = tokens[i]) {
    if (tok.type === "paragraph_open") {
      content.push({
        type: "paragraph",
        content: parseInlineChildren(inlineChildrenAt(tokens, i + 1)),
      });
      i += 3;
    } else if (tok.type === "bullet_list_open" || tok.type === "ordered_list_open") {
      const parse = tok.type === "bullet_list_open" ? parseBulletList : parseOrderedList;
      const { node, next } = parse(tokens, i, tok);
      content.push(stripId(node));
      i = next;
    } else {
      i++;
    }
  }

  if (!content.length) {
    content.push({ type: "paragraph", content: [] });
  }

  return { type: "listItem", content };
}

// Parse inline token children (flat array from mdi.parse → inline token → children).
// Maintains a mark stack to accumulate active marks for each text token.
function parseInlineChildren(tokens: Token[]): TiptapNode[] {
  const nodes: TiptapNode[] = [];
  const markStack: TiptapMark[] = [];
  for (const tok of tokens) {
    const handle = Object.hasOwn(INLINE_HANDLERS, tok.type) ? INLINE_HANDLERS[tok.type] : null;
    // html_inline, entity, image and the rest are dropped. Images are out of scope.
    const node = handle?.(tok, markStack);
    if (node) nodes.push(node);
  }
  return nodes;
}

// Either returns a node to emit, or changes the mark stack and returns nothing.
type InlineHandler = (tok: Token, markStack: TiptapMark[]) => TiptapNode | void;

function textNode(tok: Token, markStack: TiptapMark[]): TiptapNode | void {
  if (!tok.content) return;
  const marks = markStack.length ? [...markStack] : undefined;
  return { type: "text", text: tok.content, ...(marks ? { marks } : {}) };
}

const openMark =
  (type: string): InlineHandler =>
  (_tok, markStack) => {
    markStack.push({ type });
  };

const closeMark =
  (type: string): InlineHandler =>
  (_tok, markStack) => {
    removeLastMark(markStack, type);
  };

function openLink(tok: Token, markStack: TiptapMark[]): void {
  const href = tok.attrGet("href") ?? "";
  const title = tok.attrGet("title");
  markStack.push({
    type: "link",
    attrs: { href, target: null, rel: null, ...(title ? { title } : {}) },
  });
}

const INLINE_HANDLERS: Record<string, InlineHandler> = {
  text: textNode,
  text_special: textNode,
  // WHY: a softbreak is a newline inside a paragraph, so it reads as a space.
  softbreak: () => ({ type: "text", text: " " }),
  hardbreak: () => ({ type: "hardBreak" }),
  code_inline: (tok, markStack) => ({
    type: "text",
    text: tok.content,
    marks: [...markStack, { type: "code" }],
  }),
  strong_open: openMark("bold"),
  strong_close: closeMark("bold"),
  em_open: openMark("italic"),
  em_close: closeMark("italic"),
  s_open: openMark("strike"),
  s_close: closeMark("strike"),
  link_open: openLink,
  link_close: closeMark("link"),
};

function removeLastMark(stack: TiptapMark[], type: string): void {
  const i = stack.findLastIndex((mark) => mark.type === type);
  if (i >= 0) stack.splice(i, 1);
}

function headingLevel(markup: string): number {
  const n = markup.length;
  return Math.min(Math.max(n, 1), 6);
}

function stampId(node: TiptapNode): TiptapNode {
  return { ...node, attrs: { ...node.attrs, id: generateBlockId() } };
}

// WHY: Nested blocks (inside blockquote, list items) must not carry top-level IDs.
// The ID stamping contract: only direct children of "doc" get an id attribute.
function stripId(node: TiptapNode): TiptapNode {
  if (!node.attrs || !("id" in node.attrs)) return node;
  const { id: _id, ...rest } = node.attrs;
  if (Object.keys(rest).length > 0) return { ...node, attrs: rest };
  const { attrs: _attrs, ...bare } = node;
  return bare;
}

// =========================
// SERIALIZER (TipTap -> markdown)
// =========================

export function tiptapToMarkdown(doc: unknown): string {
  const d = doc as TiptapDoc;
  if (!d || d.type !== "doc" || !Array.isArray(d.content)) return "";
  return d.content
    .map((node) => nodeToMd(node, 0))
    .filter(Boolean)
    .join("\n\n");
}

type MdWriter = (node: TiptapNode, listDepth: number) => string;

function numAttr(node: TiptapNode, key: string): number | undefined {
  const value = node.attrs?.[key];
  return typeof value === "number" ? value : undefined;
}

function strAttr(node: TiptapNode, key: string): string | undefined {
  const value = node.attrs?.[key];
  return typeof value === "string" ? value : undefined;
}

function childrenToMd(node: TiptapNode, listDepth: number): string {
  return (node.content ?? [])
    .map((child) => nodeToMd(child, listDepth))
    .filter(Boolean)
    .join("\n\n");
}

function headingToMd(node: TiptapNode): string {
  const level = numAttr(node, "level") ?? 1;
  const prefix = "#".repeat(Math.min(Math.max(level, 1), 6));
  return `${prefix} ${inlineToMd(node.content ?? [])}`;
}

function orderedListToMd(node: TiptapNode, listDepth: number): string {
  const start = numAttr(node, "start") ?? 1;
  return (node.content ?? [])
    .map((item, i) => listItemToMd(item, `${start + i}.`, listDepth))
    .join("\n");
}

function blockquoteToMd(node: TiptapNode): string {
  return childrenToMd(node, 0)
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

function codeBlockToMd(node: TiptapNode): string {
  const lang = strAttr(node, "language") ?? "";
  return `\`\`\`${lang}\n${extractPlainText(node.content ?? [])}\n\`\`\``;
}

// WHY: the contract's markdown form is an image alone in its paragraph, so this
// writes back `![title](watch-url)`.
function youtubeToMd(node: TiptapNode): string {
  const videoId = strAttr(node, "videoId") ?? "";
  if (!YOUTUBE_ID_RE.test(videoId)) return "";
  const title = strAttr(node, "title") ?? "";
  const rawStart = numAttr(node, "start") ?? 0;
  const start = rawStart > 0 ? rawStart : 0;
  const url = `https://www.youtube.com/watch?v=${videoId}${start ? `&t=${start}` : ""}`;
  return `![${escapeMdText(title)}](${url})`;
}

const dropped: MdWriter = () => "";

function taskBullet(item: TiptapNode): string {
  return item.attrs?.checked === true ? "- [x]" : "- [ ]";
}

// GFM pipe table. The first row is the header; a cell holds its paragraphs on one line.
function tableToMd(node: TiptapNode): string {
  const rows = (node.content ?? []).map((row) =>
    (row.content ?? []).map((cell) =>
      (cell.content ?? [])
        .map((block) => inlineToMd(block.content ?? []))
        .join(" ")
        .replace(/\|/g, "\\|"),
    ),
  );
  const [header, ...body] = rows;
  if (!header) return "";
  const width = Math.max(...rows.map((row) => row.length));
  const line = (cells: string[]) =>
    `| ${Array.from({ length: width }, (_, i) => cells[i] ?? "").join(" | ")} |`;
  const rule = `| ${Array.from({ length: width }, () => "---").join(" | ")} |`;
  return [line(header), rule, ...body.map(line)].join("\n");
}

const MD_WRITERS: Record<string, MdWriter> = {
  paragraph: (node) => inlineToMd(node.content ?? []),
  heading: headingToMd,
  bulletList: (node, listDepth) =>
    (node.content ?? []).map((item) => listItemToMd(item, "-", listDepth)).join("\n"),
  orderedList: orderedListToMd,
  // WHY: a listItem outside a list shouldn't happen, but its content still renders.
  listItem: (node, listDepth) => listItemContentsToMd(node, listDepth),
  blockquote: blockquoteToMd,
  codeBlock: codeBlockToMd,
  horizontalRule: () => "---",
  hardBreak: () => "  \n",
  youtube: youtubeToMd,
  taskList: (node, listDepth) =>
    (node.content ?? []).map((item) => listItemToMd(item, taskBullet(item), listDepth)).join("\n"),
  taskItem: (node, listDepth) => listItemContentsToMd(node, listDepth),
  table: tableToMd,
  // WHY: images and cmsBlock are out of scope for the notes bridge.
  image: dropped,
  cmsBlock: dropped,
  tableRow: dropped,
  tableCell: dropped,
  tableHeader: dropped,
  text: (node) => inlineTextToMd(node),
};

function nodeToMd(node: TiptapNode, listDepth: number): string {
  const write = Object.hasOwn(MD_WRITERS, node.type) ? MD_WRITERS[node.type] : null;
  return write ? write(node, listDepth) : childrenToMd(node, listDepth);
}

function listItemToMd(item: TiptapNode, bullet: string, depth: number): string {
  const indent = "  ".repeat(depth);
  const content = listItemContentsToMd(item, depth + 1);
  const lines = content.split("\n");
  if (!lines.length) return `${indent}${bullet} `;
  const first = `${indent}${bullet} ${lines[0]}`;
  const rest = lines
    .slice(1)
    .map((l) => (l.trim() ? `${indent}  ${l}` : l))
    .join("\n");
  return rest ? `${first}\n${rest}` : first;
}

function listItemContentsToMd(item: TiptapNode, depth: number): string {
  const parts: string[] = [];
  for (const child of item.content ?? []) {
    if (child.type === "paragraph") {
      parts.push(inlineToMd(child.content ?? []));
    } else if (child.type === "bulletList" || child.type === "orderedList") {
      parts.push(nodeToMd(child, depth));
    } else {
      parts.push(nodeToMd(child, depth));
    }
  }
  return parts.join("\n");
}

function inlineToMd(nodes: TiptapNode[]): string {
  return nodes.map((n) => inlineTextToMd(n)).join("");
}

// WHY `*` for italic, never `_`: underscore emphasis has CommonMark word-boundary
// rules, so `_` could break round-trips next to identifiers.
const MARK_WRAPS: Record<string, (text: string) => string> = {
  bold: (text) => `**${text}**`,
  italic: (text) => `*${text}*`,
  strike: (text) => `~~${text}~~`,
};

// A code span keeps its raw text verbatim and replaces whatever was wrapped before it.
function applyMark(text: string, mark: TiptapMark, raw: string): string {
  if (mark.type === "code") return `\`${raw}\``;
  const wrap = Object.hasOwn(MARK_WRAPS, mark.type) ? MARK_WRAPS[mark.type] : null;
  return wrap ? wrap(text) : text;
}

function inlineTextToMd(node: TiptapNode): string {
  if (node.type === "hardBreak") return "  \n";
  if (node.type !== "text") return "";

  // WHY: plain text is escaped so literal *, _, `, [ and \ never read as markup.
  const escaped = escapeMdText(node.text ?? "");
  if (!node.marks?.length) return escaped;

  // WHY: the link wraps outermost to make [text](url), so it goes last.
  const linkMark = node.marks.find((m) => m.type === "link");
  const text = node.marks
    .filter((m) => m.type !== "link")
    .reduce((acc, mark) => applyMark(acc, mark, node.text ?? ""), escaped);
  if (!linkMark) return text;

  const href = typeof linkMark.attrs?.href === "string" ? linkMark.attrs.href : "";
  // WHY: link text is already escaped and the href never is. A code mark already
  // swapped in its raw text, so text is used as-is.
  return `[${text}](${href})`;
}

// WHY: Escape characters that markdown parsers treat as markup delimiters.
// Only escapes in plain text; code spans and link hrefs handle their own content.
function escapeMdText(text: string): string {
  return (
    text
      // Backslash must be first to avoid double-escaping.
      .replace(/\\/g, "\\\\")
      .replace(/\*/g, "\\*")
      .replace(/_/g, "\\_")
      .replace(/`/g, "\\`")
      .replace(/\[/g, "\\[")
  );
}

function extractPlainText(nodes: TiptapNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === "text") return n.text ?? "";
      if (n.type === "hardBreak") return "\n";
      return extractPlainText(n.content ?? []);
    })
    .join("");
}
