<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { CollectionLayout, PublicTestimonial } from "#src/testimonials/types.js";
	import TestimonialGrid from "#src/testimonials/svelte/TestimonialGrid.svelte";
	import TestimonialCarousel from "#src/testimonials/svelte/TestimonialCarousel.svelte";
	import TestimonialCompact from "#src/testimonials/svelte/TestimonialCompact.svelte";
	import TestimonialHighlight from "#src/testimonials/svelte/TestimonialHighlight.svelte";

	// =========================
	// PROPS
	// =========================
	let {
		testimonials,
		layout = "grid",
		emptyMessage = "No testimonials yet.",
	}: {
		testimonials: PublicTestimonial[];
		layout?: CollectionLayout;
		emptyMessage?: string;
	} = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if testimonials.length === 0}
	<p class="text-sm text-gray-500 dark:text-gray-300">{emptyMessage}</p>
{:else if layout === "carousel"}
	<TestimonialCarousel {testimonials} />
{:else if layout === "compact"}
	<TestimonialCompact {testimonials} />
{:else if layout === "highlight"}
	<TestimonialHighlight {testimonials} />
{:else}
	<TestimonialGrid {testimonials} />
{/if}
