<script lang="ts" module>
import type { SegmentContent } from "#src/components/segmented/segment.svelte";

/** One destination. See `SegmentContent` for everything a segment can say. */
export type SegmentedNavItem = SegmentContent & { href: string };
</script>

<script lang="ts">
// =========================
// IMPORTS
// =========================
import { cn } from "@heyramzi/utils";
import Segment from "#src/components/segmented/segment.svelte";
import SegmentedTrack from "#src/components/segmented/segmented-track.svelte";
import { segmentedTriggerClass } from "#src/components/segmented/segmented.js";

// =========================
// TYPES
// =========================
type Props = {
	// WHY a third component: tabs are a `tablist`, filters a `group` of toggles,
	// and this goes to sibling pages, so it's a `nav` of links with `aria-current`.

	// Links give middle-click, bookmarks and the back button. The look comes from
	// `segmented.ts` and `segment.svelte`, so nothing here can drift.
	items: readonly SegmentedNavItem[];
	/** The href that is current. Compared after trailing slashes are dropped. */
	current: string;
	ariaLabel: string;
	/** Fill the row rather than sit at its natural width. */
	block?: boolean;
	class?: string;
};

// =========================
// PROPS
// =========================
let {
	items,
	current,
	ariaLabel,
	block = false,
	class: className,
}: Props = $props();

// =========================
// DERIVED
// =========================
let currentHref = $derived(current.replace(/\/$/, ""));
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- WHY scroll, not wrap: seven brands outrun a laptop pane. A clipped segment
     must read as "more to the right", never as a broken row. -->
<nav
	class={cn("no-scrollbar flex max-w-full min-w-0 overflow-x-auto", className)}
	aria-label={ariaLabel}
>
	<SegmentedTrack fill={block}>
		{#each items as item (item.href)}
			{@const active = item.href.replace(/\/$/, "") === currentHref}
			<a
				href={item.href}
				aria-current={active ? "page" : undefined}
				title={item.label}
				class={segmentedTriggerClass({ fill: block, active })}
			>
				<Segment
					label={item.label}
					count={item.count}
					icon={item.icon}
					image={item.image}
					done={item.done}
					badge={item.badge}
					{active}
				/>
			</a>
		{/each}
	</SegmentedTrack>
</nav>
