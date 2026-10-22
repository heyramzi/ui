export { default as RichEditor } from "#src/editor/editor.svelte";
export { default as RichRenderer } from "#src/editor/renderer.svelte";
export {
  renderTiptapContent,
  extractHeadings,
  extractYoutubeVideos,
} from "#src/editor/serializer.js";
export type { ExtractedHeading, ExtractedYoutubeVideo } from "#src/editor/serializer.js";
export { BlockIdExtension, generateBlockId } from "#src/editor/block-id.js";

// WHY: the markdown bridge and block-ops pull in markdown-it, so they aren't
// re-exported here. Blog pages would bundle it. Import from their subpaths:
//   @heyramzi/ui/editor/markdown
//   @heyramzi/ui/editor/block-ops
