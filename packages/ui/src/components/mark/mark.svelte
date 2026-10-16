<script lang="ts">
// =========================
// IMPORTS
// =========================
import { cn } from "@heyramzi/utils";

// =========================
// TYPES
// =========================

/**
 * A brand's mark at glyph size: a kit icon, a channel avatar, a client logo.
 * One renderer, because three places each handled a missing file their own way.
 */
type Props = {
	/** The file. A missing or broken one falls back to the label's initial. */
	src?: string;
	/** Read for the fallback letter. The mark itself is decorative. */
	label: string;
	/** `circle` crops a photograph to a disc, `square` fits a logo whole. */
	shape?: "square" | "circle";
	class?: string;
};

// =========================
// PROPS
// =========================
let { src, label, shape = "square", class: className }: Props = $props();

// =========================
// STATE
// =========================
/** The src that failed, so a later one gets its own chance to load. */
let broken = $state("");

// =========================
// DERIVED
// =========================
let round = $derived(shape === "circle");
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- WHY the letter is a fallback and not a backdrop: a tile drawn UNDER the mark
     shows its initial through every logo that is not a full-bleed square. -->
{#if src && broken !== src}
	<img
		{src}
		alt=""
		loading="lazy"
		referrerpolicy="no-referrer"
		class={cn(
			"size-4 shrink-0",
			round ? "rounded-full object-cover" : "object-contain",
			className,
		)}
		onerror={() => (broken = src)}
	/>
{:else}
	<span
		class={cn(
			"bg-muted text-muted-foreground flex size-4 shrink-0 items-center justify-center text-[10px] leading-none font-bold",
			round ? "rounded-full" : "rounded-xs",
			className,
		)}
	>
		{label.charAt(0)}
	</span>
{/if}
