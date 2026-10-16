import { Node as TiptapNode, mergeAttributes, type Extensions } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extension-placeholder";
import { DragHandle } from "@tiptap/extension-drag-handle";
import { BlockIdExtension } from "./block-id.js";

const CmsBlock = TiptapNode.create({
  name: "cmsBlock",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      blockType: {
        default: "unknown",
      },
      data: {
        default: {},
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="cms-block"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const blockType =
      typeof HTMLAttributes.blockType === "string" ? HTMLAttributes.blockType : "unknown";
    const { data: _data, blockType: _blockType, ...attrs } = HTMLAttributes;
    return [
      "div",
      mergeAttributes(attrs, {
        class: "cms-block-node",
        "data-type": "cms-block",
        "data-block-type": blockType,
      }),
      ["strong", {}, "CMS block"],
      ["span", {}, ` ${blockType}`],
    ];
  },
});

// WHY: the same facade markup as serializer.ts, so authors see what ships. The
// editor only needs an atomic node; click-to-load lives in renderer.svelte.
const Youtube = TiptapNode.create({
  name: "youtube",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      videoId: { default: null },
      title: { default: "" },
      start: { default: 0 },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-video-id]" }];
  },
  renderHTML({ HTMLAttributes }) {
    const videoId = typeof HTMLAttributes.videoId === "string" ? HTMLAttributes.videoId : "";
    const title = typeof HTMLAttributes.title === "string" ? HTMLAttributes.title : "";
    const start = typeof HTMLAttributes.start === "number" ? HTMLAttributes.start : 0;
    return [
      "div",
      mergeAttributes({
        class: "tiptap-youtube",
        "data-video-id": videoId,
        "data-start": String(start),
      }),
      [
        "button",
        {
          type: "button",
          class: "tiptap-youtube-trigger",
          "aria-label": `Play video: ${title}`,
        },
        [
          "img",
          {
            class: "tiptap-youtube-poster",
            src: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            alt: "",
            loading: "lazy",
            width: "480",
            height: "360",
          },
        ],
        ["span", { class: "tiptap-youtube-play", "aria-hidden": "true" }],
        ["span", { class: "tiptap-youtube-title" }, title],
      ],
    ];
  },
});

function dedupeExtensions(extensions: Extensions): Extensions {
  const seen = new Set<string>();
  return extensions.filter((extension) => {
    if (!extension || typeof extension !== "object") return false;
    const name =
      "name" in extension && typeof (extension as { name?: unknown }).name === "string"
        ? (extension as { name: string }).name
        : "";
    if (!name) return true;
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

const DRAG_DOTS = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="2.5" cy="2.5" r="1" fill="currentColor"/><circle cx="2.5" cy="6" r="1" fill="currentColor"/><circle cx="2.5" cy="9.5" r="1" fill="currentColor"/><circle cx="6" cy="2.5" r="1" fill="currentColor"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="9.5" r="1" fill="currentColor"/></svg>`;

function dragHandle() {
  return DragHandle.configure({
    render() {
      const el = document.createElement("div");
      el.classList.add("drag-handle");
      el.innerHTML = DRAG_DOTS;
      return el;
    },
  });
}

export type ExtensionOptions = {
  preset: "full" | "notes";
  placeholder: string;
  blockIds: boolean;
};

/** The extension list for a preset: `full` adds CMS blocks, YouTube, images and H4. */
export function buildExtensions({ preset, placeholder, blockIds }: ExtensionOptions): Extensions {
  const full = preset === "full";
  return dedupeExtensions([
    StarterKit.configure({
      heading: { levels: full ? [1, 2, 3, 4] : [1, 2, 3] },
      link: { openOnClick: false },
    }),
    ...(full ? [CmsBlock, Youtube, Image.configure({ inline: false })] : []),
    Placeholder.configure({ placeholder }),
    dragHandle(),
    ...(blockIds ? [BlockIdExtension] : []),
  ]);
}
