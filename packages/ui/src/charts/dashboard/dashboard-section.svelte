<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { ArrowRight } from "phosphor-svelte";
	import type { Snippet } from "svelte";
	import { cn } from "#src/lib/utils.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		title: string;
		/** One line on the right: a window, a provenance, a count. Never a sentence. */
		note?: string;
		/** The page that owns this area, when one page does. */
		href?: string;
		/** The link's wording. Translated at the call site. */
		openLabel?: string;
		/** Controls that scope the whole area, like a period filter. Pinned right, after the note. */
		actions?: Snippet;
		children: Snippet;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		title,
		note,
		href,
		openLabel = "Open",
		actions,
		children,
		class: className,
	}: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- An area of a dashboard, named, then its numbers. No box of its own: its
     cards are the containers, and a card in a card is never right. -->
<section class={cn("flex flex-col gap-4", className)}>
	<!-- Centred, not baseline: a filter control is taller than the title, and a baseline row
	     hangs the title off its bottom edge. -->
	<div class="flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-2">
		<h2 class="text-base font-semibold tracking-tight">{title}</h2>
		<div class="flex items-center gap-3">
			{#if note}
				<p class="text-xs text-muted-foreground">{note}</p>
			{/if}
			{#if href}
				<a
					{href}
					class="group inline-flex items-center gap-1 rounded-md text-xs font-medium text-muted-foreground transition-colors duration-[var(--duration-quick)] hover:text-foreground focus-visible:shadow-(--ring-focus) focus-visible:outline-none"
				>
					{openLabel}
					<ArrowRight
						aria-hidden="true"
						size={12}
						class="shrink-0 transition-transform duration-[var(--duration-quick)] ease-out group-hover:translate-x-0.5"
					/>
				</a>
			{/if}
			{#if actions}
				{@render actions()}
			{/if}
		</div>
	</div>

	{@render children()}
</section>
