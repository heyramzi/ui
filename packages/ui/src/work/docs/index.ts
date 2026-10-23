/**
 * The document surface: a page to write one, the "Edited" chip, the `…` menu and the outline
 * logic behind the edge ticks. The app supplies the data and every handler.
 */
export { default as DocEditorPage } from "#src/work/docs/doc-editor-page.svelte";
export { default as DocMenu } from "#src/work/docs/doc-menu.svelte";
export { default as EditedChip } from "#src/work/docs/edited-chip.svelte";
export { DEFAULT_DOC_LABELS, docLabels, type DocLabels } from "#src/work/docs/labels.js";
export {
  anchorIds,
  headingsOf,
  outlineOf,
  outlineOfDoc,
  slugify,
  type FoundHeading,
  type OutlineHeading,
  type OutlineLevel,
} from "#src/work/docs/outline.js";
export {
  editStamp,
  editedLabel,
  parseStamp,
  shortDate,
  type DateInput,
  type StampOptions,
} from "#src/work/docs/edited.js";
export {
  copyOptions,
  filterMenu,
  menuItems,
  shortcutLabel,
  shortcutTarget,
  type CopyKind,
  type CopyOption,
  type MenuId,
  type MenuItem,
  type Shortcut,
} from "#src/work/docs/menu.js";
