// WHY our own slugify: the website's uses NFKD, which strips accents from French
// headings. The vibe-kit utils one doesn't, so accented anchors would differ.
function slugify(input: string, maxLength = 60): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, maxLength)
    .replace(/-$/g, "");
}

type Mark = {
  type?: string;
  attrs?: Record<string, unknown>;
};

type Node = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: Node[];
  marks?: Mark[];
  text?: string;
};

export type ExtractedHeading = {
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
};

export type ExtractedYoutubeVideo = {
  videoId: string;
  title: string;
  start: number;
};

type RenderContext = { headingSlugs: Map<string, number> };

function newContext(): RenderContext {
  return { headingSlugs: new Map() };
}

function uniqueHeadingId(text: string, ctx: RenderContext): string {
  const base = slugify(text) || "section";
  const seen = ctx.headingSlugs.get(base) ?? 0;
  ctx.headingSlugs.set(base, seen + 1);
  return seen === 0 ? base : `${base}-${seen + 1}`;
}

export function renderTiptapContent(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  return renderNode(content as Node, newContext());
}

export function extractHeadings(
  content: unknown,
  options: { levels?: ReadonlyArray<1 | 2 | 3 | 4 | 5 | 6> } = {},
): ExtractedHeading[] {
  if (!content || typeof content !== "object") return [];
  const levels = options.levels ?? [2, 3];
  const ctx = newContext();
  const headings: ExtractedHeading[] = [];
  walkHeadings(content as Node, ctx, levels, headings);
  return headings;
}

function walkHeadings(
  node: Node,
  ctx: RenderContext,
  levels: ReadonlyArray<1 | 2 | 3 | 4 | 5 | 6>,
  out: ExtractedHeading[],
): void {
  if (node.type === "heading") {
    const level = clampHeadingLevel(node.attrs?.level);
    const text = extractText(node.content).trim();
    const id = uniqueHeadingId(text, ctx);
    if (text && levels.includes(level)) out.push({ id, level, text });
    return;
  }
  if (node.content?.length) {
    for (const child of node.content) walkHeadings(child, ctx, levels, out);
  }
}

// WHY: a consumer like the website's VideoObject schema gets one entry per
// `youtube` node without redoing the walk or the videoId check.
export function extractYoutubeVideos(content: unknown): ExtractedYoutubeVideo[] {
  if (!content || typeof content !== "object") return [];
  const videos: ExtractedYoutubeVideo[] = [];
  walkYoutubeVideos(content as Node, videos);
  return videos;
}

function walkYoutubeVideos(node: Node, out: ExtractedYoutubeVideo[]): void {
  if (node.type === "youtube") {
    const video = youtubeVideoOf(node);
    if (video) out.push(video);
    return;
  }
  for (const child of node.content ?? []) walkYoutubeVideos(child, out);
}

function youtubeVideoOf(node: Node): ExtractedYoutubeVideo | null {
  const videoId = strAttr(node.attrs, "videoId") ?? "";
  if (!YOUTUBE_VIDEO_ID_RE.test(videoId)) return null;
  return {
    videoId,
    title: strAttr(node.attrs, "title") ?? "",
    start: numAttr(node.attrs, "start") ?? 0,
  };
}

// A typed read of one attr: the value when it has the asked type, else undefined.
function strAttr(attrs: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = attrs?.[key];
  return typeof value === "string" ? value : undefined;
}

function numAttr(attrs: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = attrs?.[key];
  return typeof value === "number" ? value : undefined;
}

type Renderer = (node: Node, ctx: RenderContext) => string;

// Wraps a node's rendered children in one tag.
const wrapIn =
  (tag: string): Renderer =>
  (node, ctx) =>
    `<${tag}>${renderChildren(node.content, ctx) || ""}</${tag}>`;

function renderHeading(node: Node, ctx: RenderContext): string {
  const level = clampHeadingLevel(node.attrs?.level);
  const text = extractText(node.content).trim();
  const inner = renderChildren(node.content, ctx) || "";
  if (!text) return `<h${level}>${inner}</h${level}>`;
  const id = uniqueHeadingId(text, ctx);
  return `<h${level} id="${escapeAttr(id)}">${inner}</h${level}>`;
}

function renderOrderedList(node: Node, ctx: RenderContext): string {
  const start = numAttr(node.attrs, "start");
  const attrs = renderAttributes({ start: start === undefined ? undefined : String(start) });
  return `<ol${attrs}>${renderChildren(node.content, ctx) || ""}</ol>`;
}

function renderCodeBlock(node: Node): string {
  const lang = strAttr(node.attrs, "language");
  const language = lang ? ` class="language-${escapeAttr(lang)}"` : "";
  return `<pre><code${language}>${escapeHtml(extractText(node.content))}</code></pre>`;
}

function numString(attrs: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = numAttr(attrs, key);
  return value === undefined ? undefined : String(value);
}

function renderImage(node: Node): string {
  const src = strAttr(node.attrs, "src");
  if (!src) return "";
  const attrs = renderAttributes({
    alt: strAttr(node.attrs, "alt") ?? "",
    title: strAttr(node.attrs, "title"),
    width: numString(node.attrs, "width"),
    height: numString(node.attrs, "height"),
    "data-align": strAttr(node.attrs, "align"),
  });
  return `<img src="${escapeAttr(src)}"${attrs} />`;
}

function renderTable(node: Node, ctx: RenderContext): string {
  const winnerColIndex = findWinnerColumnIndex(node);
  const rows = node.content ?? [];
  const body = rows
    .map((row, rowIdx) => renderTableRow(row, ctx, { winnerColIndex, isFirstRow: rowIdx === 0 }))
    .join("");
  const tableClass = winnerColIndex !== -1 ? ' class="comparison-table"' : "";
  return `<div class="tiptap-table-wrap"><table${tableClass}>${body}</table></div>`;
}

const RENDERERS: Record<string, Renderer> = {
  doc: (node, ctx) => renderChildren(node.content, ctx),
  paragraph: wrapIn("p"),
  heading: renderHeading,
  blockquote: wrapIn("blockquote"),
  bulletList: wrapIn("ul"),
  orderedList: renderOrderedList,
  listItem: wrapIn("li"),
  codeBlock: renderCodeBlock,
  horizontalRule: () => "<hr />",
  hardBreak: () => "<br />",
  image: renderImage,
  cmsBlock: () => "",
  youtube: renderYoutube,
  table: renderTable,
  tableRow: (node, ctx) => renderTableRow(node, ctx, { winnerColIndex: -1, isFirstRow: false }),
  tableCell: (node, ctx) => renderTableCell(node, ctx, false),
  tableHeader: (node, ctx) => renderTableCell(node, ctx, false),
  text: renderText,
};

// Own keys only, so a node typed "toString" never reaches Object.prototype.
function pick<T>(table: Record<string, T>, key: string | undefined): T | undefined {
  return key !== undefined && Object.hasOwn(table, key) ? table[key] : undefined;
}

function renderNode(node: Node, ctx: RenderContext): string {
  const render = pick(RENDERERS, node.type);
  return render ? render(node, ctx) : renderChildren(node.content, ctx);
}

function renderChildren(content: Node[] | undefined, ctx: RenderContext): string {
  if (!content?.length) return "";
  return content.map((child) => renderNode(child, ctx)).join("");
}

// WHY a facade, never a bare <iframe> on first paint: it's roughly 700KB and wrecks
// LCP. renderer.svelte's delegated click listener swaps in the iframe.
const YOUTUBE_VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function renderYoutube(node: Node): string {
  const videoId = typeof node.attrs?.videoId === "string" ? node.attrs.videoId : "";
  if (!YOUTUBE_VIDEO_ID_RE.test(videoId)) return "";
  const title = typeof node.attrs?.title === "string" ? node.attrs.title : "";
  const start = typeof node.attrs?.start === "number" ? node.attrs.start : 0;
  const safeVideoId = escapeAttr(videoId);
  const safeTitle = escapeAttr(title);

  return (
    `<div class="tiptap-youtube" data-video-id="${safeVideoId}" data-start="${start}">` +
    `<button type="button" class="tiptap-youtube-trigger" aria-label="Play video: ${safeTitle}">` +
    `<img class="tiptap-youtube-poster" src="https://i.ytimg.com/vi/${safeVideoId}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360" />` +
    `<span class="tiptap-youtube-play" aria-hidden="true"></span>` +
    `<span class="tiptap-youtube-title">${escapeHtml(title)}</span>` +
    `</button></div>`
  );
}

function renderTableRow(
  row: Node,
  ctx: RenderContext,
  { winnerColIndex, isFirstRow }: { winnerColIndex: number; isFirstRow: boolean },
): string {
  if (row.type !== "tableRow" || !row.content?.length) {
    return `<tr>${renderChildren(row.content, ctx)}</tr>`;
  }
  const cellsHtml = row.content
    .map((cell, cellIdx) => {
      const isWinnerCell = !isFirstRow && winnerColIndex !== -1 && cellIdx === winnerColIndex;
      return renderTableCell(cell, ctx, isWinnerCell);
    })
    .join("");
  return `<tr>${cellsHtml}</tr>`;
}

function renderTableCell(cell: Node, ctx: RenderContext, isWinnerCell: boolean): string {
  const tag = cell.type === "tableHeader" ? "th" : "td";
  const colspan =
    typeof cell.attrs?.colspan === "number" && cell.attrs.colspan !== 1
      ? String(cell.attrs.colspan)
      : undefined;
  const rowspan =
    typeof cell.attrs?.rowspan === "number" && cell.attrs.rowspan !== 1
      ? String(cell.attrs.rowspan)
      : undefined;
  const inner = renderChildren(cell.content, ctx);
  if (!isWinnerCell) {
    const attrs = renderAttributes({ colspan, rowspan });
    return `<${tag}${attrs}>${inner}</${tag}>`;
  }
  const winnerText = extractText(cell.content).trim();
  const winner = normalizeWinner(winnerText);
  const attrs = renderAttributes({
    class: "winner-cell",
    "data-winner": winner,
    colspan,
    rowspan,
  });
  return `<${tag}${attrs}>${inner}</${tag}>`;
}

const WINNER_HEADERS = ["winner", "gagnant", "vainqueur"];

function findWinnerColumnIndex(table: Node): number {
  const firstRow = table.content?.[0];
  if (!firstRow?.content) return -1;
  for (let i = 0; i < firstRow.content.length; i++) {
    const headerText = extractText(firstRow.content[i]?.content).trim().toLowerCase();
    if (WINNER_HEADERS.includes(headerText)) return i;
  }
  return -1;
}

// WHY the first word: "Acme wins" and "Acme" are one winner. The host styles a
// product with `[data-winner="acme"]`, so the serializer names no product.
function normalizeWinner(text: string): string {
  const lower = text.toLowerCase().trim();
  if (!lower) return "other";
  if (lower.startsWith("tie") || lower.startsWith("égal") || lower.startsWith("egal")) {
    return "tie";
  }
  return lower.match(/^[\p{L}\p{N}]+/u)?.[0] ?? "other";
}

function renderText(node: Node): string {
  const text = escapeHtml(node.text ?? "");
  if (!node.marks?.length) return text;

  return node.marks.reduce((html, mark) => wrapMark(html, mark), text);
}

const MARK_TAGS: Record<string, string> = {
  bold: "strong",
  italic: "em",
  strike: "s",
  underline: "u",
  code: "code",
};

function wrapMark(content: string, mark: Mark): string {
  if (mark.type === "link") {
    const attrs = renderAttributes({
      href: strAttr(mark.attrs, "href") ?? "",
      target: strAttr(mark.attrs, "target"),
      rel: strAttr(mark.attrs, "rel"),
    });
    return `<a${attrs}>${content}</a>`;
  }
  const tag = pick(MARK_TAGS, mark.type);
  return tag ? `<${tag}>${content}</${tag}>` : content;
}

function renderAttributes(attrs: Record<string, string | undefined>): string {
  const parts = Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => ` ${key}="${escapeAttr(value ?? "")}"`);
  return parts.join("");
}

function extractText(content: Node[] | undefined): string {
  if (!content?.length) return "";
  return content
    .map((node) => {
      if (node.type === "text") return node.text ?? "";
      return extractText(node.content);
    })
    .join("");
}

function clampHeadingLevel(level: unknown): 1 | 2 | 3 | 4 | 5 | 6 {
  if (level === 1 || level === 2 || level === 3 || level === 4 || level === 5 || level === 6) {
    return level;
  }
  return 2;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("`", "&#96;");
}
