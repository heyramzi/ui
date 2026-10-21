import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";

// WHY: Top-level block types that need stable IDs for agentic read/write ops.
// Inline nodes (text, hardBreak) and list items are not top-level in ProseMirror
// doc structure, so they are excluded.
const TOP_LEVEL_BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "blockquote",
  "codeBlock",
  "horizontalRule",
]);

/** Generate a stable unique ID for a block. Uses crypto.randomUUID() which is
 * available in Cloudflare Workers, Node 24+, and all modern browsers. */
export function generateBlockId(): string {
  return crypto.randomUUID();
}

function isTopLevelBlock(node: ProseMirrorNode): boolean {
  return TOP_LEVEL_BLOCK_TYPES.has(node.type.name);
}

const blockIdPluginKey = new PluginKey("blockId");

/**
 * TipTap extension that stamps a stable unique `id` on every top-level block,
 * set on creation and kept on update. Opt in via the `blockIds` prop.
 */
export const BlockIdExtension = Extension.create({
  name: "blockId",

  addGlobalAttributes() {
    return [
      {
        types: Array.from(TOP_LEVEL_BLOCK_TYPES),
        attributes: {
          id: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-block-id") || null,
            renderHTML: (attributes) => {
              if (!attributes.id) return {};
              return { "data-block-id": attributes.id };
            },
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: blockIdPluginKey,
        appendTransaction(_transactions, _oldState, newState) {
          const { tr, doc } = newState;
          let changed = false;

          doc.forEach((node, offset) => {
            if (!isTopLevelBlock(node)) return;
            if (node.attrs.id) return;

            const id = generateBlockId();
            tr.setNodeMarkup(offset, undefined, { ...node.attrs, id });
            changed = true;
          });

          return changed ? tr : null;
        },
      }),
    ];
  },
});
