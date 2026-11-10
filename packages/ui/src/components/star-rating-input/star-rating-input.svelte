<script lang="ts" module>
	/**
	 * Two sizes, picked by the job: `sm` reads a value back in a row or cell,
	 * `lg` is the ask.
	 */
	// A middle `md` step used to exist. Nobody could place it, so the same question
	// ended up asked at three sizes.
	export type StarRatingSize = "sm" | "lg";

	const STAR_SIZE: Record<StarRatingSize, string> = {
		sm: "size-4",
		lg: "size-7",
	};

	// Side by side stars can't overlap, so a 24px target (WCAG 2.5.8) means a 24px pitch.
	const HIT_SIZE: Record<StarRatingSize, string> = {
		sm: "p-1",
		lg: "p-1",
	};

	/** Pop duration plus the longest stagger, after which the class can come off. */
	const POP_WINDOW_MS = 350 + 4 * 40;
</script>

<script lang="ts">
	import { RatingGroup } from "bits-ui";
	import { Star } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";

	interface Props {
		/** Current rating value (0 = unrated). */
		value: number;
		/** Maximum rating. Defaults to 5. */
		max?: number;
		/** Visual size of each star. `sm` reads back, `lg` asks. */
		size?: StarRatingSize;
		/** Render as static display, no hover or click. */
		readonly?: boolean;
		/** Disable interaction. */
		disabled?: boolean;
		/** Form field name for native submission. When set, a hidden input is rendered. */
		name?: string;
		/** What is rated, like "Rate the delivery". The value is added for a screen reader. */
		ariaLabel?: string;
		/** Per-step descriptive labels (length must equal max). */
		labels?: readonly string[];
		/** Show the label of the currently hovered/selected step beside the stars. */
		showLabel?: boolean;
		class?: string;
		/** Called with the new rating after a pick. */
		onValueChange?: (value: number) => void;
	}

	let {
		value = $bindable(0),
		max = 5,
		size = "sm",
		readonly = false,
		disabled = false,
		name,
		ariaLabel,
		labels,
		showLabel = false,
		class: className,
		onValueChange,
	}: Props = $props();

	/** Held for the length of the pop, then dropped so the next pick can replay it. */
	let popping = $state(false);
	let popTimer: ReturnType<typeof setTimeout> | undefined;
	let starSize = $derived(STAR_SIZE[size]);
	let hitSize = $derived(HIT_SIZE[size]);
	let subject = $derived(ariaLabel ?? "Rating");

	function valueText(rating: number): string {
		if (rating <= 0) return "No rating";
		const label = labels?.[rating - 1];
		return `${rating} of ${max} stars${label ? `, ${label}` : ""}`;
	}

	function picked(next: number) {
		onValueChange?.(next);

		// Drop the class before re-adding it, or a second pick inside the animation
		// window finds it already set and nothing replays.
		popping = false;
		clearTimeout(popTimer);
		requestAnimationFrame(() => {
			popping = true;
			popTimer = setTimeout(() => (popping = false), POP_WINDOW_MS);
		});
	}
</script>

<!-- One star, drawn once. It used to be written twice, once per branch, and the
     two copies had already drifted apart on the glow. -->
{#snippet star(filled: boolean)}
	<Star
		aria-hidden="true"
		class={cn("star", starSize, filled && "is-filled")}
		weight={filled ? "fill" : "regular"}
	/>
{/snippet}

{#snippet caption(shown: number)}
	{#if showLabel && shown > 0 && labels?.[shown - 1]}
		<span class="rating-caption">{labels[shown - 1]}</span>
	{/if}
{/snippet}

<!-- Bits UI's RatingGroup is the WAI-ARIA rating slider: one Tab stop, arrows, Home to clear, End, digits. -->
<div class={cn("rating", `rating-${size}`, className)}>
	{#if readonly}
		<div class="stars" role="img" aria-label="{subject}, {valueText(value)}">
			{#each Array(max) as _, i (i)}
				<span class={cn("hit", hitSize)}>{@render star(i < value)}</span>
			{/each}
		</div>
		{@render caption(value)}
		{#if name}
			<input type="hidden" {name} {value} />
		{/if}
	{:else}
		<RatingGroup.Root
			bind:value
			{max}
			{disabled}
			{name}
			aria-label={subject}
			aria-valuetext={valueText}
			onValueChange={picked}
			class={cn("stars stars-input", popping && "is-popping", disabled && "is-disabled")}
		>
			{#snippet children({ items })}
				{#each items as item (item.index)}
					<RatingGroup.Item
						index={item.index}
						data-on={item.index < value}
						style="--pop-delay: {item.index * 40}ms"
						class={cn("hit hit-button", hitSize)}
					>
						{@render star(item.state === "active")}
					</RatingGroup.Item>
				{/each}
				{@render caption(items.filter((item) => item.state === "active").length)}
			{/snippet}
		</RatingGroup.Root>
	{/if}
</div>

<style>
	@layer theme, base, components, utilities;

	@layer components {
		.rating {
			--like-pop: var(--duration-medium);
			--like-pop-ease: var(--ease-smooth-out);
			--like-fill: var(--duration-quick);
			--like-ease: var(--ease-smooth-out);

			display: flex;
			align-items: center;
			gap: 0.25rem;
		}

		.rating :global(.stars) {
			display: flex;
			align-items: center;
		}

		.rating :global(.hit) {
			display: inline-flex;
			border-radius: var(--radius-sm);
		}

		.rating :global(.hit-button) {
			transition: transform var(--duration-quick, 150ms) var(--ease-smooth-out, ease);
		}

		.rating :global(.stars-input) {
			border-radius: var(--radius-sm);
		}

		.rating :global(.stars-input:focus-visible) {
			outline: none;
			box-shadow: 0 0 0 2px var(--color-ring);
		}

		@media (hover: hover) and (pointer: fine) {
			.rating :global(.stars-input:not(.is-disabled) .hit-button:hover) {
				transform: scale(1.1);
			}
		}

		.rating :global(.stars-input:not(.is-disabled) .hit-button:active) {
			transform: scale(0.95);
		}

		.rating :global(.is-disabled) {
			cursor: not-allowed;
			opacity: 0.6;
		}

		.rating :global(.star) {
			color: var(--color-border);
			transition: color var(--like-fill) var(--like-ease);
		}

		.rating :global(.star.is-filled) {
			color: var(--color-warning-400);
		}

		/* The glow is the size's business, not a prop: it belongs to the ask, where
		   the stars are large enough to carry it, and it turned to mud at 16px. */
		.rating-lg :global(.star.is-filled) {
			filter: drop-shadow(0 0 4px color-mix(in oklab, var(--color-warning-400) 45%, transparent));
		}

		/* transitions.dev like-button pop. Every selected star pops, left to right,
		   as one gesture. A class on the group drives it, since rebuilding the row
		   would drop keyboard focus. */
		.rating :global(.is-popping .hit-button[data-on="true"]) {
			animation: t-like-pop var(--like-pop) var(--like-pop-ease) var(--pop-delay, 0ms);
		}

		/* Inside the slider the caption sits in the stars' row, so it keeps the outer gap itself. */
		.rating :global(.stars-input .rating-caption) {
			margin-inline-start: 0.25rem;
		}

		.rating-caption {
			font-size: 0.75rem;
			font-weight: 500;
			font-variant-numeric: tabular-nums;
			color: var(--color-muted-foreground);
		}

		@media (prefers-reduced-motion: reduce) {
			.rating :global(.hit-button),
			.rating :global(.is-popping .hit-button[data-on="true"]) {
				animation: none;
				transition: none;
			}

			.rating :global(.stars-input:not(.is-disabled) .hit-button:active) {
				transform: none;
			}

			@media (hover: hover) and (pointer: fine) {
				.rating :global(.stars-input:not(.is-disabled) .hit-button:hover) {
					transform: none;
				}
			}
		}
	}

	@keyframes t-like-pop {
		0% {
			transform: scale(1);
		}
		30% {
			transform: scale(0.82);
		}
		100% {
			transform: scale(1);
		}
	}
</style>
