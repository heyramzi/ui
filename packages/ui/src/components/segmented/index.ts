/**
 * The segmented control. Three components draw it, one per ARIA shape, and they
 * share the track (`segmented.ts`) and segment body (`segment.svelte`).
 */

// WHY no low-level `Tabs.Root`/`List`/`Trigger` here: that's `shadcn/tabs`. This
// is the data-driven layer on top, and `AnimatedTabs` is the way in.

// Past `SEGMENT_MAX` objects the tail collapses into a menu: `collapse.ts`
// decides, `segmented-overflow.svelte` draws it. No call site opts in.
import AnimatedTabs, {
  type TabDef,
  type TabGroup,
  type TabsPlacement,
} from "#src/components/segmented/animated-tabs.svelte";
import SegmentedFilter from "#src/components/segmented/segmented-filter.svelte";
import SegmentedNav, {
  type SegmentedNavItem,
} from "#src/components/segmented/segmented-nav.svelte";
import SectionRuns, {
  type SectionRun,
  type SectionStrip,
} from "#src/components/segmented/section-runs.svelte";
import { type SegmentContent } from "#src/components/segmented/segment.svelte";
import { segmentedRowClass, type SegmentedVariant } from "#src/components/segmented/segmented.js";
import { SEGMENT_MAX } from "#src/components/segmented/collapse.js";

export {
  AnimatedTabs,
  SectionRuns,
  SegmentedFilter,
  SegmentedNav,
  SEGMENT_MAX,
  segmentedRowClass,
  type SectionRun,
  type SectionStrip,
  type SegmentContent,
  type SegmentedNavItem,
  type SegmentedVariant,
  type TabDef,
  type TabGroup,
  type TabsPlacement,
};
