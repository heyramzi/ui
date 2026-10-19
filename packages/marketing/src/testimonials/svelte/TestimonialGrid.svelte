<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { PublicTestimonial } from "#src/testimonials/types.js";
	import type { GetCaption } from "#src/testimonials/svelte/types.js";
	import { renderTestimonialContent } from "#src/testimonials/render-content.js";
	import StarRating from "#src/testimonials/svelte/StarRating.svelte";
	import TestimonialVideoPlayer from "#src/testimonials/svelte/TestimonialVideoPlayer.svelte";

	// =========================
	// TYPES
	// =========================
	interface Props {
		testimonials: PublicTestimonial[];
		initialCount?: number;
		showAllLabel?: string;
		showLessLabel?: string;
		moreLabel?: string;
		lessLabel?: string;
		clampChars?: number;
		getCaption?: GetCaption;
	};

	// =========================
	// PROPS
	// =========================
	let {
		testimonials,
		initialCount = 9,
		showAllLabel,
		showLessLabel = "Show less",
		moreLabel = "Show more",
		lessLabel = "Show less",
		clampChars = 280,
		getCaption,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let showAll = $state(false);
	let expanded = $state<Record<string, boolean>>({});

	// =========================
	// DERIVED
	// =========================
	const visible = $derived(showAll ? testimonials : testimonials.slice(0, initialCount));
	const hasMore = $derived(testimonials.length > initialCount);
	const expandLabel = $derived(showAllLabel ?? `Show all ${testimonials.length} testimonials`);

	// =========================
	// FUNCTIONS
	// =========================
	function shouldClamp(content: string): boolean {
		return content.length > clampChars;
	}

	function toggle(id: string) {
		expanded[id] = !expanded[id];
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if testimonials.length > 0}
	<div class="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3">
		{#each visible as testimonial (testimonial.id)}
			{@const isExpanded = expanded[testimonial.id] ?? false}
			{@const needsClamp = shouldClamp(testimonial.content)}
			{@const rendered = renderTestimonialContent(testimonial.content)}
			<article
				class="break-inside-avoid overflow-hidden rounded-xl border border-border bg-card shadow-sm"
			>
				{#if testimonial.videoUrl}
					{@const cap = getCaption ? getCaption(testimonial.videoUrl) : null}
					<TestimonialVideoPlayer src={testimonial.videoUrl} caption={cap} rounded={false} />
				{/if}

				<div class="p-5">
					{#if testimonial.rating}
						<div class="mb-3">
							<StarRating rating={testimonial.rating} />
						</div>
					{/if}

					<blockquote class="mb-3 text-sm leading-relaxed text-foreground">
						<div
							class={`testimonial-content ${needsClamp ? "can-clamp" : ""} ${needsClamp && !isExpanded ? "is-clamped" : ""}`}
						>
							<p>"<!-- eslint-disable-next-line svelte/no-at-html-tags -->{@html rendered}"</p>
						</div>
					</blockquote>

					{#if needsClamp}
						<button
							type="button"
							onclick={() => toggle(testimonial.id)}
							class="mb-4 text-xs font-medium text-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline"
							aria-expanded={isExpanded}
						>
							{isExpanded ? lessLabel : moreLabel}
						</button>
					{/if}

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
								class="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground"
							>
								{testimonial.authorName?.charAt(0).toUpperCase() ?? "?"}
							</div>
						{/if}

						<div class="min-w-0">
							<p class="truncate text-sm font-semibold text-foreground">
								{testimonial.authorName}
							</p>
							{#if testimonial.authorRole || testimonial.authorCompany}
								<p class="truncate text-xs text-muted-foreground">
									{[testimonial.authorRole, testimonial.authorCompany].filter(Boolean).join(" · ")}
								</p>
							{/if}
						</div>
					</div>
				</div>
			</article>
		{/each}
	</div>

	{#if hasMore}
		<div class="mt-6 flex justify-center">
			<button
				type="button"
				onclick={() => (showAll = !showAll)}
				class="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
			>
				{showAll ? showLessLabel : expandLabel}
			</button>
		</div>
	{/if}
{/if}

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
	/* WHY grid rows: 0fr to 1fr animates to the text's real height with no
	   max-height guess, and the row never goes below the five-line floor. */
	.testimonial-content {
		position: relative;
		display: grid;
		grid-template-rows: 1fr;
		transition: grid-template-rows 360ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.testimonial-content > p {
		overflow: hidden;
	}
	.testimonial-content.can-clamp > p {
		min-height: calc(1.625em * 5);
	}
	.testimonial-content.is-clamped {
		grid-template-rows: 0fr;
	}
	.testimonial-content.is-clamped::after {
		content: "";
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2.25em;
		background: linear-gradient(to bottom, transparent, var(--card));
		pointer-events: none;
	}
	.testimonial-content :global(strong) {
		font-weight: 600;
		color: var(--foreground);
	}
</style>
