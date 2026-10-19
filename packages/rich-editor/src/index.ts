export { default as RichEditor } from "#src/editor.svelte";
export { default as RichRenderer } from "#src/renderer.svelte";
export {
  renderTiptapContent,
  extractHeadings,
  extractYoutubeVideos,
} from "#src/serializer.js";
export type {
  ExtractedHeading,
  ExtractedYoutubeVideo,
} from "#src/serializer.js";
export { BlockIdExtension, generateBlockId } from "#src/block-id.js";

// WHY: the markdown bridge and block-ops pull in markdown-it, so they aren't
// re-exported here. Blog pages would bundle it. Import from their subpaths:
//   @heyramzi/rich-editor/markdown
//   @heyramzi/rich-editor/block-ops
