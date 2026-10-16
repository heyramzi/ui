<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { PublicTestimonial } from "#src/testimonials/types.js";
	import { renderTestimonialContent } from "#src/testimonials/render-content.js";
	import StarRating from "#src/testimonials/svelte/StarRating.svelte";
	import TestimonialVideoPlayer from "#src/testimonials/svelte/TestimonialVideoPlayer.svelte";

	// =========================
	// PROPS
	// =========================
	let { testimonials }: { testimonials: PublicTestimonial[] } = $props();

	// =========================
	// STATE
	// =========================
	let activeIndex = $state(0);
	let scrollContainer: HTMLDivElement | undefined = $state();

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		if (!scrollContainer) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const index = Number((entry.target as HTMLElement).dataset.index);
						if (!Number.isNaN(index)) activeIndex = index;
					}
				}
			},
			{ root: scrollContainer, threshold: 0.6 },
		);

		const slides = scrollContainer.querySelectorAll("[data-index]");
		for (const slide of slides) observer.observe(slide);

		return () => observer.disconnect();
	});

	// =========================
	// FUNCTIONS
	// =========================
	function scrollTo(index: number) {
		if (!scrollContainer) return;
		const slides = scrollContainer.querySelectorAll("[data-index]");
		slides[index]?.scrollIntoView({ behavior: "smooth", inline: "center" });
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class="space-y-4">
	<div
		bind:this={scrollContainer}
		class="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
		style="scrollbar-width: none; -ms-overflow-style: none;"
	>
		{#each testimonials as testimonial, i (testimonial.id)}
			<div
				data-index={i}
				class="w-[85%] flex-shrink-0 snap-center rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:w-[70%] lg:w-[45%] dark:border-gray-700 dark:bg-gray-900"
			>
				{#if testimonial.videoUrl}
					<div class="mb-4">
						<TestimonialVideoPlayer src={testimonial.videoUrl} nativeControls />
					</div>
				{/if}

				{#if testimonial.rating}
					<div class="mb-3">
						<StarRating rating={testimonial.rating} />
					</div>
				{/if}

				<blockquote class="mb-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
					"<!-- eslint-disable-next-line svelte/no-at-html-tags -->{@html renderTestimonialContent(
						testimonial.content,
					)}"
				</blockquote>

				<div class="flex items-center gap-3">
					{#if testimonial.authorPhotoUrl}
						<img
							src={testimonial.authorPhotoUrl}
							alt={testimonial.authorName}
							class="size-9 rounded-full object-cover"
							loading="lazy"
						/>
					{:else}
						<div
							class="flex size-9 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300"
						>
							{testimonial.authorName.charAt(0).toUpperCase()}
						</div>
					{/if}

					<div>
						<p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
							{testimonial.authorName}
						</p>
						{#if testimonial.authorRole || testimonial.authorCompany}
							<p class="text-xs text-gray-500 dark:text-gray-300">
								{[testimonial.authorRole, testimonial.authorCompany].filter(Boolean).join(" at ")}
							</p>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if testimonials.length > 1}
		<div class="flex justify-center gap-1.5">
			{#each testimonials as _, i (i)}
				<button
					type="button"
					class="size-2 rounded-full transition-colors {i === activeIndex
						? 'bg-gray-900 dark:bg-gray-100'
						: 'bg-gray-300 dark:bg-gray-700'}"
					onclick={() => scrollTo(i)}
					aria-label="Go to testimonial {i + 1}"
				></button>
			{/each}
		</div>
	{/if}
</div>
