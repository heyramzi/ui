/**
 * The two document-only behaviours that need the editor's own DOM: an anchor on every
 * heading with a "Copy link" on hover, and a code block with line numbers and a
 * language label. Both are decorations, so the document stays plain Tiptap JSON.
 */
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { anchorIds } from "#src/editor/anchors.js";

const LINK_ICON = `<svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M240 88.23a54.43 54.43 0 0 1-16 37L189.25 160a54.27 54.27 0 0 1-38.63 16h-.05A54.63 54.63 0 0 1 96 119.84a8 8 0 0 1 16 .45A38.62 38.62 0 0 0 150.58 160a38.4 38.4 0 0 0 27.31-11.31l34.75-34.75a38.63 38.63 0 0 0-54.63-54.63l-11 11A8 8 0 0 1 135.7 59l11-11a54.65 54.65 0 0 1 77.3 0A54.86 54.86 0 0 1 240 88.23ZM109 185.66l-11 11A38.41 38.41 0 0 1 70.6 208a38.63 38.63 0 0 1-27.29-65.94L78 107.31a38.63 38.63 0 0 1 54.63 0 8 8 0 0 0 11.31-11.31 54.65 54.65 0 0 0-77.3 0L32 130.75A54.62 54.62 0 0 0 70.56 224a54.28 54.28 0 0 0 38.64-16l11-11a8 8 0 0 0-11.2-11.34Z"/></svg>`;

export type HeadingAnchorsOptions = {
  /** The word on the hover button. */
  label: string;
  /** Runs after the link is copied; a host shows a toast here. */
  oncopy?: (url: string, id: string) => void;
};

const anchorsKey = new PluginKey("headingAnchors");

/** Gives every heading an `id` and a hover "Copy link" that copies a URL to that section. */
export const HeadingAnchors = Extension.create<HeadingAnchorsOptions>({
  name: "headingAnchors",

  addOptions() {
    return { label: "Copy link", oncopy: undefined };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    return [
      new Plugin({
        key: anchorsKey,
        props: {
          decorations(state) {
            const found: { pos: number; size: number; label: string }[] = [];
            state.doc.descendants((node, pos) => {
              if (node.type.name !== "heading") return;
              found.push({ pos, size: node.nodeSize, label: node.textContent.trim() });
            });
            if (found.length === 0) return DecorationSet.empty;
            const ids = anchorIds(found.map((heading) => heading.label));
            const decorations = found.flatMap((heading, i) => {
              const id = ids[i];
              return [
                Decoration.node(heading.pos, heading.pos + heading.size, {
                  id,
                  class: "has-anchor",
                }),
                Decoration.widget(
                  heading.pos + heading.size - 1,
                  () => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "heading-anchor";
                    button.contentEditable = "false";
                    button.innerHTML = `${LINK_ICON}<span>${options.label}</span>`;
                    button.addEventListener("mousedown", (event) => event.preventDefault());
                    button.addEventListener("click", () => {
                      const { origin, pathname, search } = window.location;
                      const url = `${origin}${pathname}${search}#${id}`;
                      void navigator.clipboard?.writeText(url).catch(() => {});
                      button.dataset.copied = "true";
                      setTimeout(() => delete button.dataset.copied, 1400);
                      options.oncopy?.(url, id);
                    });
                    return button;
                  },
                  { side: 1, key: `anchor-${id}`, ignoreSelection: true },
                ),
              ];
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

export type CodeLanguage = { value: string; label: string };

export const CODE_LANGUAGES: CodeLanguage[] = [
  { value: "", label: "Plain text" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "svelte", label: "Svelte" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "bash", label: "Bash" },
  { value: "sql", label: "SQL" },
  { value: "python", label: "Python" },
  { value: "markdown", label: "Markdown" },
];

/** "1\n2\n3" for a block of three lines: the gutter, which CSS prints beside the code. */
export function lineNumbers(code: string): string {
  const count = code.split("\n").length;
  return Array.from({ length: count }, (_, i) => i + 1).join("\n");
}

const codeKey = new PluginKey("codeBlockChrome");

/** Line numbers in a gutter and a language picker in the corner of every code block. */
export const CodeBlockChrome = Extension.create({
  name: "codeBlockChrome",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: codeKey,
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (node.type.name !== "codeBlock") return;
              const language = typeof node.attrs.language === "string" ? node.attrs.language : "";
              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  "data-lines": lineNumbers(node.textContent),
                }),
                Decoration.widget(
                  pos + 1,
                  (view, getPos) => {
                    const select = document.createElement("select");
                    select.className = "code-language";
                    select.contentEditable = "false";
                    select.setAttribute("aria-label", "Language");
                    const known = CODE_LANGUAGES.some((item) => item.value === language);
                    const options = known
                      ? CODE_LANGUAGES
                      : [...CODE_LANGUAGES, { value: language, label: language }];
                    for (const item of options) {
                      const option = document.createElement("option");
                      option.value = item.value;
                      option.textContent = item.label;
                      option.selected = item.value === language;
                      select.append(option);
                    }
                    select.addEventListener("mousedown", (event) => event.stopPropagation());
                    select.addEventListener("change", () => {
                      const at = (getPos() ?? 1) - 1;
                      const target = view.state.doc.nodeAt(at);
                      if (!target) return;
                      view.dispatch(
                        view.state.tr.setNodeMarkup(at, undefined, {
                          ...target.attrs,
                          language: select.value || null,
                        }),
                      );
                      view.focus();
                    });
                    return select;
                  },
                  { side: -1, key: `lang-${pos}-${language}`, stopEvent: () => true },
                ),
              );
            });
            return decorations.length
              ? DecorationSet.create(state.doc, decorations)
              : DecorationSet.empty;
          },
        },
      }),
    ];
  },
});
