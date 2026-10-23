<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { PublicTestimonial } from "#src/testimonials/types.js";
	import StarRating from "#src/testimonials/svelte/StarRating.svelte";
	import AuthorAvatar from "#src/testimonials/svelte/AuthorAvatar.svelte";

	// =========================
	// PROPS
	// =========================
	let { testimonials }: { testimonials: PublicTestimonial[] } = $props();

	// =========================
	// DERIVED
	// =========================
	const avgRating = $derived.by(() => {
		const rated = testimonials.filter(
			(t): t is PublicTestimonial & { rating: number } => t.rating !== null,
		);
		if (rated.length === 0) return 0;
		return rated.reduce((sum, t) => sum + t.rating, 0) / rated.length;
	});

	const displayRating = $derived(Math.round(avgRating * 10) / 10);

	const avatars = $derived(
		[...testimonials]
			.toSorted((a, b) => (b.authorPhotoUrl ? 1 : 0) - (a.authorPhotoUrl ? 1 : 0))
			.slice(0, 5),
	);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class="flex flex-wrap items-center gap-4">
	{#if avatars.length > 0}
		<div class="flex -space-x-2">
			{#each avatars as testimonial (testimonial.id)}
				<AuthorAvatar
					name={testimonial.authorName ?? "Reviewer"}
					src={testimonial.authorPhotoUrl}
					class="size-8 border-2 border-white dark:border-gray-900"
					fallbackClass="bg-gray-100 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300"
				/>
			{/each}
		</div>
	{/if}

	<div class="flex flex-col gap-1">
		{#if avgRating > 0}
			<div class="flex items-center gap-2">
				<StarRating rating={Math.round(avgRating)} />
				<span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
					{displayRating}
				</span>
			</div>
		{/if}

		<!-- WHY: gray-500 on a light surface measured 3.05:1 at 12px non-bold,
		     below the 4.5:1 AA floor and too small for the large-text exception. -->
		<p class="text-xs text-gray-700 dark:text-gray-300">
			{#if avgRating > 0}
				Rated {displayRating}/5 based on {testimonials.length.toLocaleString()}
				{testimonials.length === 1 ? "review" : "reviews"}
			{:else}
				{testimonials.length.toLocaleString()}
				{testimonials.length === 1 ? "review" : "reviews"}
			{/if}
		</p>
	</div>
</div>
