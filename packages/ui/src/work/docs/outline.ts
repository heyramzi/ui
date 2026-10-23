/**
 * The outline of a document: which headings it lists, and the anchor each one gets.
 * Pure, so the editor's anchors and the outline's ids can never disagree.
 */

import { anchorIds } from "#src/editor/anchors.js";

export { anchorIds, slugify } from "#src/editor/anchors.js";

export type OutlineLevel = 2 | 3;

export type OutlineHeading = { id: string; label: string; level: OutlineLevel };

type DocNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  text?: string;
};

function textOf(node: DocNode): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(textOf).join("");
}

export type FoundHeading = { id: string; label: string; level: number };

/** Every heading in document order, at any depth, with its anchor. */
export function headingsOf(doc: unknown): FoundHeading[] {
  const found: { label: string; level: number }[] = [];
  const walk = (node: DocNode) => {
    if (node.type === "heading") {
      const level = typeof node.attrs?.level === "number" ? node.attrs.level : 1;
      found.push({ label: textOf(node).trim(), level });
      return;
    }
    for (const child of node.content ?? []) walk(child);
  };
  if (doc && typeof doc === "object") walk(doc as DocNode);
  const ids = anchorIds(found.map((heading) => heading.label));
  return found.map((heading, i) => ({ id: ids[i], label: heading.label, level: heading.level }));
}

/**
 * What the outline lists: H2 and H3 with a label. H1 and H4 are ignored, and a
 * document with fewer than two entries gets no outline at all.
 */
export function outlineOf(headings: FoundHeading[]): OutlineHeading[] {
  const items = headings.filter(
    (heading): heading is FoundHeading & { level: OutlineLevel } =>
      (heading.level === 2 || heading.level === 3) && heading.label !== "",
  );
  if (items.length < 2) return [];
  return items.map(({ id, label, level }) => ({ id, label, level }));
}

/** The outline of a Tiptap document. */
export function outlineOfDoc(doc: unknown): OutlineHeading[] {
  return outlineOf(headingsOf(doc));
}
