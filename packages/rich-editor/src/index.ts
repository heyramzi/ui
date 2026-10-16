export { default as RichEditor } from "./editor.svelte";
export { default as RichRenderer } from "./renderer.svelte";
export {
  renderTiptapContent,
  extractHeadings,
  extractYoutubeVideos,
} from "./serializer.js";
export type {
  ExtractedHeading,
  ExtractedYoutubeVideo,
} from "./serializer.js";
export { BlockIdExtension, generateBlockId } from "./block-id.js";

// WHY: the markdown bridge and block-ops pull in markdown-it, so they aren't
// re-exported here. Blog pages would bundle it. Import from their subpaths:
//   @heyramzi/rich-editor/markdown
//   @heyramzi/rich-editor/block-ops
