<script lang="ts" generics="T extends string">
// =========================
// IMPORTS
// =========================
import { cn } from "@heyramzi/utils";
import { SegmentedFilter, SegmentedNav, type TabDef } from "@heyramzi/ui/components/segmented";

// =========================
// TYPES
// =========================
interface Props {
	options: readonly TabDef<T>[];
	value: T;
	/**
	 * Give this and the strip is links, so the choice survives reload, back and a
	 * shared link. Omit it and the strip is a `<SegmentedFilter>` the caller owns.
	 */
	href?: (value: T) => string;
	/** Filter mode only. Ignored when `href` is set. */
	onValueChange?: (value: T) => void;
	ariaLabel: string;
	class?: string;
};

// =========================
// PROPS
// =========================
let { options, value, href, onValueChange, ariaLabel, class: className }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- WHY one component for the window, not a `SegmentedNav` here and a
     `SegmentedFilter` there: identical pages announced themselves differently.
     Place it first in the toolbar's right cluster. -->
{#if href}
	<SegmentedNav
		items={options.map((option) => ({ ...option, href: href(option.value) }))}
		current={href(value)}
		{ariaLabel}
		class={className}
	/>
{:else}
	<SegmentedFilter
		{options}
		{value}
		{onValueChange}
		{ariaLabel}
		block={false}
		class={cn("shrink-0", className)}
	/>
{/if}
