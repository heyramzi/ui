<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { PublicTestimonial } from "#src/testimonials/types.js";
	import { renderTestimonialContent } from "#src/testimonials/render-content.js";
	import StarRating from "#src/testimonials/svelte/StarRating.svelte";
	import AuthorAvatar from "#src/testimonials/svelte/AuthorAvatar.svelte";
	import TestimonialVideoPlayer from "#src/testimonials/svelte/TestimonialVideoPlayer.svelte";
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

		<blockquote
			class="mb-6 [overflow-wrap:anywhere] text-lg leading-relaxed text-gray-900 sm:text-xl dark:text-gray-200"
		>
			"<!-- eslint-disable-next-line svelte/no-at-html-tags -->{@html renderTestimonialContent(
				featured.content,
			)}"
		</blockquote>

		{#if featured.videoUrl}
			<div class="mb-6">
				<TestimonialVideoPlayer src={featured.videoUrl} nativeControls />
			</div>
		{/if}

		<div class="flex items-center gap-3">
			<AuthorAvatar
				name={featured.authorName}
				src={featured.authorPhotoUrl}
				class="size-12"
				fallbackClass="bg-gray-100 text-base text-gray-700 dark:bg-gray-900 dark:text-gray-300"
			/>

			<div class="min-w-0">
				<p class="text-base font-semibold break-words text-gray-900 dark:text-gray-100">
					{featured.authorName}
				</p>
				{#if featured.authorRole || featured.authorCompany}
					<p class="text-sm break-words text-gray-500 dark:text-gray-300">
						{[featured.authorRole, featured.authorCompany].filter(Boolean).join(" at ")}
					</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
