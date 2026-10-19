import type { markdownToTiptap } from "#src/markdown.js";

type Doc = ReturnType<typeof markdownToTiptap>;

/** The top-level block nodes of a doc. */
export function blocks(doc: Doc) {
  return doc.content;
}

/** True when every top-level block carries a string id. */
export function allHaveIds(doc: Doc) {
  return doc.content.every((n) => typeof n.attrs?.id === "string" && n.attrs.id.length > 0);
}
