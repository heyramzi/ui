# @heyramzi/ui/editor

A Svelte 5 rich text editor on [Tiptap](https://tiptap.dev): headings, lists, tables, images, YouTube links, a slash menu, an image toolbar and optional block ids. It saves Tiptap JSON, and a renderer turns that JSON back into HTML on the server, so a crawler sees the body.

Tiptap is a dependency of `@heyramzi/ui`, and a bundler only ships it when you import this subpath.

## Install

```
pnpm add @heyramzi/ui
```

`svelte` (5.57 or newer) is a peer. The editor's toolbar uses the kit's `Button` and `Input`, so import the kit's `tokens.css` once and point Tailwind at the package:

```css
@import "tailwindcss";
@import "@heyramzi/ui/tokens.css";

@source "../node_modules/@heyramzi/ui";
```

## Usage

```svelte
<script lang="ts">
  import { RichEditor, RichRenderer } from "@heyramzi/ui/editor";

  let doc = $state<Record<string, unknown> | null>(null);
</script>

<RichEditor content={doc} onchange={(json) => (doc = json)} preset="full" />

<RichRenderer content={doc} />
```

## What is inside

| Export | What it is |
| --- | --- |
| `RichEditor` | The editor. `preset` is `full` or `notes`, `blockIds` stamps a stable id on each block |
| `RichRenderer` | Renders saved JSON to HTML, on the server too, with a click-to-load YouTube facade |
| `renderTiptapContent`, `extractHeadings`, `extractYoutubeVideos` | The serializer, for a table of contents or a sitemap |
| `BlockIdExtension`, `generateBlockId` | The block id extension |
| `@heyramzi/ui/editor/markdown` | `tiptapToMarkdown` and `markdownToTiptap`. It pulls in markdown-it, so it isn't in the root export |
| `@heyramzi/ui/editor/block-ops` | Edit a document by block id: replace, insert, delete |
| `@heyramzi/ui/editor/inline-editor` | A single-block editor for one field |
| `@heyramzi/ui/editor/content.css` | The typography for editor and renderer. Both import it already |

## Comparison tables

A table whose first row has a `Winner` (or `Gagnant`, `Vainqueur`) header gets a `comparison-table` class, and each cell in that column becomes a pill with `data-winner` set to the first word of the cell, lowercased. `tie` and `other` are styled for you. Colour one product from your own CSS:

```css
.tiptap-content table.comparison-table .winner-cell[data-winner="acme"] p {
  background: color-mix(in srgb, var(--color-signal) 14%, transparent);
  color: var(--color-signal);
}
```
