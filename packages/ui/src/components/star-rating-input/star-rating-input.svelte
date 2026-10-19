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

const HIT_SIZE: Record<StarRatingSize, string> = {
	sm: "p-0.5",
	lg: "p-1",
};

/** Pop duration plus the longest stagger, after which the class can come off. */
const POP_WINDOW_MS = 350 + 4 * 40;
</script>

<script lang="ts">
import { Star } from "phosphor-svelte";
import { cn } from "@heyramzi/utils";

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
	/** ARIA label for the radiogroup. */
	ariaLabel?: string;
	/** Per-step descriptive labels (length must equal max). */
	labels?: readonly string[];
	/** Show the label of the currently hovered/selected step beside the stars. */
	showLabel?: boolean;
	class?: string;
	onchange?: (value: number) => void;
};

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
	onchange,
}: Props = $props();

let hover = $state(0);
/** Held for the length of the pop, then dropped so the next pick can replay it. */
let popping = $state(false);
let popTimer: ReturnType<typeof setTimeout> | undefined;
let displayed = $derived(hover || value);
let starSize = $derived(STAR_SIZE[size]);
let hitSize = $derived(HIT_SIZE[size]);
let groupAriaLabel = $derived(ariaLabel ?? `Rating, ${max} stars`);
let labelText = $derived(
	displayed > 0 && labels && labels.length >= displayed ? labels[displayed - 1] : "",
);

function buttonAriaLabel(step: number): string {
	const stepLabel = labels?.[step - 1];
	const base = `${step} of ${max}`;
	return stepLabel ? `${base} (${stepLabel})` : base;
}

function setRating(step: number) {
	if (readonly || disabled) return;
	value = step;
	onchange?.(step);

	// Drop the class before re-adding it, or a second pick inside the animation
	// window finds it already set and nothing replays.
	popping = false;
	clearTimeout(popTimer);
	requestAnimationFrame(() => {
		popping = true;
		popTimer = setTimeout(() => (popping = false), POP_WINDOW_MS);
	});
}

function handleEnter(step: number) {
	if (readonly || disabled) return;
	hover = step;
}

function handleLeave() {
	if (readonly || disabled) return;
	hover = 0;
}
</script>

<!-- One star, drawn once. It used to be written twice, once per branch, and the
     two copies had already drifted apart on the glow. -->
{#snippet star(step: number)}
	<Star
		class={cn("star", starSize, step <= displayed && "is-filled")}
		weight={step <= displayed ? "fill" : "regular"}
	/>
{/snippet}

<div class={cn("rating", `rating-${size}`, className)}>
	<div
		class={cn("stars", popping && "is-popping")}
		role={readonly ? "img" : "radiogroup"}
		aria-label={groupAriaLabel}
		onmouseleave={handleLeave}
	>
		{#each Array(max) as _, i (i)}
			{@const step = i + 1}
			{#if readonly}
				<span class={cn("hit", hitSize)}>{@render star(step)}</span>
			{:else}
				<button
					type="button"
					role="radio"
					aria-checked={value === step}
					aria-label={buttonAriaLabel(step)}
					{disabled}
					data-on={step <= value}
					onclick={() => setRating(step)}
					onmouseenter={() => handleEnter(step)}
					onfocus={() => handleEnter(step)}
					onblur={handleLeave}
					style:--pop-delay="{i * 40}ms"
					class={cn("hit hit-button", hitSize, disabled && "is-disabled")}
				>
					{@render star(step)}
				</button>
			{/if}
		{/each}
	</div>

	{#if showLabel && labelText}
		<span class="rating-caption">{labelText}</span>
	{/if}

	{#if name}
		<input type="hidden" {name} value={value} />
	{/if}
</div>

<style>
	.rating {
		--like-pop: var(--duration-medium);
		--like-pop-ease: var(--ease-smooth-out);
		--like-fill: var(--duration-quick);
		--like-ease: var(--ease-smooth-out);

		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.stars {
		display: flex;
		align-items: center;
	}

	.hit {
		display: inline-flex;
		border-radius: var(--radius-sm);
	}

	.hit-button {
		transition: transform var(--duration-quick, 150ms) var(--ease-smooth-out, ease);
	}

	.hit-button:focus-visible {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-ring);
	}

	.hit-button:not(.is-disabled):hover {
		transform: scale(1.1);
	}

	.hit-button:not(.is-disabled):active {
		transform: scale(0.95);
	}

	.is-disabled {
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
	.is-popping .hit-button[data-on="true"] {
		animation: t-like-pop var(--like-pop) var(--like-pop-ease) var(--pop-delay, 0ms);
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

	.rating-caption {
		font-size: 0.75rem;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		color: var(--color-muted-foreground);
	}

	@media (prefers-reduced-motion: reduce) {
		.hit-button,
		.is-popping .hit-button[data-on="true"] {
			animation: none;
			transition: none;
		}

		.hit-button:not(.is-disabled):hover,
		.hit-button:not(.is-disabled):active {
			transform: none;
		}
	}
</style>
