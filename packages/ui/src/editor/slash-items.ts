import type { Editor } from "@tiptap/core";
import {
  TextB,
  TextHOne,
  TextHTwo,
  TextHThree,
  ListBullets,
  ListNumbers,
  Quotes,
  CodeBlock,
  Minus,
  ImageSquare,
  Paragraph,
  VideoCamera,
  ListChecks,
  Table,
} from "phosphor-svelte";

export type SlashItem = {
  label: string;
  description: string;
  icon: typeof TextB;
  command: () => void;
};

export type SlashOptions = {
  preset: "full" | "notes";
  insertImage: () => void;
  insertYoutube: () => void;
};

/** Every slash command for a preset, filtered by the text typed after the `/`. */
export function buildSlashItems(editor: Editor, query: string, options: SlashOptions): SlashItem[] {
  const run = () => editor.chain().focus();
  const full = options.preset === "full";
  const allItems: SlashItem[] = [
    {
      label: "Heading 1",
      description: "Page title",
      icon: TextHOne,
      command: () => run().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "Heading 2",
      description: "Section heading",
      icon: TextHTwo,
      command: () => run().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Heading 3",
      description: "Subsection heading",
      icon: TextHThree,
      command: () => run().toggleHeading({ level: 3 }).run(),
    },
    {
      label: "Bullet List",
      description: "Unordered list",
      icon: ListBullets,
      command: () => run().toggleBulletList().run(),
    },
    {
      label: "Ordered List",
      description: "Numbered list",
      icon: ListNumbers,
      command: () => run().toggleOrderedList().run(),
    },
    ...(full
      ? [
          {
            label: "Checklist",
            description: "Tasks with checkboxes",
            icon: ListChecks,
            command: () => run().toggleTaskList().run(),
          },
          {
            label: "Table",
            description: "Rows and columns",
            icon: Table,
            command: () => run().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
          },
        ]
      : []),
    {
      label: "Quote",
      description: "Blockquote",
      icon: Quotes,
      command: () => run().toggleBlockquote().run(),
    },
    {
      label: "Code Block",
      description: "Code snippet",
      icon: CodeBlock,
      command: () => run().toggleCodeBlock().run(),
    },
    {
      label: "Divider",
      description: "Horizontal rule",
      icon: Minus,
      command: () => run().setHorizontalRule().run(),
    },
    ...(full
      ? [
          {
            label: "Image",
            description: "Insert from URL",
            icon: ImageSquare,
            command: options.insertImage,
          },
        ]
      : []),
    ...(full
      ? [
          {
            label: "YouTube",
            description: "Insert a video by URL",
            icon: VideoCamera,
            command: options.insertYoutube,
          },
        ]
      : []),
    {
      label: "Paragraph",
      description: "Plain text block",
      icon: Paragraph,
      command: () => run().setParagraph().run(),
    },
  ];
  if (!query) return allItems;
  const q = query.toLowerCase();
  return allItems.filter(
    (item) => item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
  );
}
