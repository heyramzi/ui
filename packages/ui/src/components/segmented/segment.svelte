<script lang="ts" module>
	import type { PhosphorIcon } from "#src/lib/icon-types.js";

	/** Everything a segment may say, for every strip drawn from this folder. */

	// WHY one shape: the tab, nav and filter strips each grew an item type and
	// drifted, down to drawing a logo fallback two ways. Now it's one type, one renderer.
	export type SegmentContent = {
		label: string;
		/** A number after the label. `0` still renders; omit for "no number". */
		count?: number;
		icon?: PhosphorIcon;
		/** A square mark drawn in place of an icon, for a brand that has one. */
		image?: string;
		/**
		 * This segment's work is finished. Drawn as a dot after the label, and only
		 * where there is no count, because a count already says the same thing.
		 */
		done?: boolean;
		/**
		 * A short note after the label, such as "Save 20%". Text where `count` is a
		 * number, in the accent colour. Drawn before a count or a done dot.
		 */
		badge?: string;
	};
</script>

<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { cn } from "#src/lib/utils.js";
	import { Mark } from "#src/components/mark/index.js";
	import CountChip from "#src/components/chip/count-chip.svelte";

	// =========================
	// TYPES
	// =========================
	interface Props extends SegmentContent {
		/**
		 * `true`/`false` when the caller owns the state. `"auto"` when bits-ui owns it
		 * in a `data-state` on the trigger, and the stylesheet answers.
		 */
		active?: boolean | "auto";
	}

	// =========================
	// PROPS
	// =========================
	let { label, count, icon: Icon, image, done = false, badge, active = false }: Props = $props();

	// =========================
	// DERIVED
	// =========================
	let auto = $derived(active === "auto");
	let on = $derived(active === true);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if image}
	<Mark
		src={image}
		{label}
		class={cn(
			"opacity-75 transition-opacity duration-fast ease-smooth-out motion-reduce:transition-none group-hover/segment:opacity-100",
			on && "opacity-100",
			auto && "group-data-[state=active]/segment:opacity-100",
		)}
	/>
{:else if Icon}
	<Icon size={16} class="shrink-0" />
{/if}

{label}

{#if badge}
	<span class="text-primary text-xs font-semibold whitespace-nowrap">{badge}</span>
{/if}

{#if count != null}
	<!-- WHY 16px, not 18: inside a 22px segment, 18 read as a chip nested in the pill. -->
	<CountChip
		{count}
		size="sm"
		tone={on ? "brand" : "neutral"}
		class={auto
			? "group-data-[state=active]/segment:bg-brand/12 group-data-[state=active]/segment:text-brand dark:group-data-[state=active]/segment:text-brand-light"
			: undefined}
	/>
{:else if done}
	<span
		class={cn(
			"size-1.5 shrink-0 rounded-full bg-muted-foreground/50",
			on && "bg-brand",
			auto && "group-data-[state=active]/segment:bg-brand",
		)}
		aria-hidden="true"
	></span>
{/if}
