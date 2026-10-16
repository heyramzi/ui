// Chrome for a component showcase: the sticky section rail, the section frame, the demo stage, the compact row for a component with no demo, and the copy control they share.

// WHY the chrome is shared and the content is not: every Studio app vendors its own component kit, so the inventory and the demos are local by nature.

// What repeats across apps is the reading structure, and it was drifting.

// Styling is scoped CSS, not Tailwind utilities: a consumer does not `@source` this package, so utility classes written here would never be generated. Every colour reads `var(--color-x, var(--x))`.

// Tailwind v4's `@theme inline` resolves a token into the utilities that use it and emits no custom property, so an app built that way has `--card` and no `--color-card`,

// while an app that declares its palette in `@theme` has the opposite. The pair covers both.
export {
  default as ShowcaseShell,
  type ShowcaseShellProps,
} from "#src/showcase/ShowcaseShell.svelte";
export { default as ShowcaseNav, type ShowcaseNavProps } from "#src/showcase/ShowcaseNav.svelte";
export {
  default as ShowcaseSection,
  type ShowcaseSectionProps,
} from "#src/showcase/ShowcaseSection.svelte";
export {
  default as ShowcaseStage,
  type ShowcaseStageProps,
} from "#src/showcase/ShowcaseStage.svelte";
export {
  default as ShowcaseVariant,
  type ShowcaseVariantProps,
} from "#src/showcase/ShowcaseVariant.svelte";
export {
  default as ShowcaseList,
  type ShowcaseListProps,
  type ShowcaseListItem,
} from "#src/showcase/ShowcaseList.svelte";
export {
  default as ShowcaseImport,
  type ShowcaseImportProps,
} from "#src/showcase/ShowcaseImport.svelte";
export type { ShowcaseSectionMeta } from "#src/showcase/types.js";
