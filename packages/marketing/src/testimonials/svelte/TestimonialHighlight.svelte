<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { PublicTestimonial } from "#src/testimonials/types.js";
	import { renderTestimonialContent } from "#src/testimonials/render-content.js";
	import StarRating from "#src/testimonials/svelte/StarRating.svelte";
	import VideoEmbed from "#src/testimonials/svelte/VideoEmbed.svelte";
	import quoteIcon from "#src/testimonials/svelte/quote-icon.svg?raw";

	// =========================
	// PROPS
	// =========================
	let { testimonials }: { testimonials: PublicTestimonial[] } = $props();

	// =========================
	// DERIVED
	// =========================
	const featured = $derived(testimonials.find((t) => t.isFeatured) || testimonials[0] || null);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if featured}
	<div
		class="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10 dark:border-gray-700 dark:bg-gray-900"
	>
		<span class="mb-4 block size-10 text-gray-200 dark:text-gray-700 [&>svg]:size-full">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html quoteIcon}
		</span>

		{#if featured.rating}
			<div class="mb-4">
				<StarRating rating={featured.rating} />
			</div>
		{/if}

		<blockquote class="mb-6 text-lg leading-relaxed text-gray-900 sm:text-xl dark:text-gray-200">
			"<!-- eslint-disable-next-line svelte/no-at-html-tags -->{@html renderTestimonialContent(
				featured.content,
			)}"
		</blockquote>

		{#if featured.videoUrl}
			<div class="mb-6">
				<VideoEmbed url={featured.videoUrl} />
			</div>
		{/if}

		<div class="flex items-center gap-3">
			{#if featured.authorPhotoUrl}
				<img
					src={featured.authorPhotoUrl}
					alt={featured.authorName}
					class="size-12 rounded-full object-cover"
					loading="lazy"
				/>
			{:else}
				<div
					class="flex size-12 items-center justify-center rounded-full bg-gray-100 text-base font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300"
				>
					{featured.authorName.charAt(0).toUpperCase()}
				</div>
			{/if}

			<div>
				<p class="text-base font-semibold text-gray-900 dark:text-gray-100">
					{featured.authorName}
				</p>
				{#if featured.authorRole || featured.authorCompany}
					<p class="text-sm text-gray-500 dark:text-gray-300">
						{[featured.authorRole, featured.authorCompany].filter(Boolean).join(" at ")}
					</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
