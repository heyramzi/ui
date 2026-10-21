/**
 * The documentation anatomy: one page component and the contents rail inside it.
 * A surface supplies a title and a body, and never lays a document out itself.
 */
export { default as DocPage } from "#src/components/docs/doc-page.svelte";
export { default as OnThisPage } from "#src/components/docs/on-this-page.svelte";
export {
  ScrollSpy,
  READ_LINE,
  type DocHeading,
  type LocateHeading,
} from "#src/components/docs/scroll-spy.svelte.js";
