<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { ArrowRight } from "phosphor-svelte";

	// =========================
	// TYPES
	// =========================
	interface Props {
		href?: string;
		/** `submit` posts the form the button sits in. */
		type?: "button" | "submit";
		disabled?: boolean;
		size?: "default" | "md" | "sm";
		tone?: "ink" | "coral";
		beam?: boolean;
		dot?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		children: import("svelte").Snippet;
	}

	// =========================
	// PROPS
	// =========================
	let {
		href,
		type = "button",
		disabled = false,
		size = "default",
		tone = "ink",
		beam = true,
		dot = true,
		class: className,
		onclick,
		children,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	let classes = $derived(
		[
			"cta-hover",
			size === "md" && "cta-hover--md",
			size === "sm" && "cta-hover--sm",
			tone === "coral" && "cta-hover--coral",
			!beam && "cta-hover--no-beam",
			!dot && "cta-hover--no-dot",
			className,
		]
			.filter(Boolean)
			.join(" "),
	);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if href}
	<a {href} {onclick} class={classes}>
		<span class="cta-hover__resting">
			{#if dot}<span class="cta-hover__dot"></span>{/if}
			<span class="cta-hover__label">{@render children()}</span>
			{#if !dot}<ArrowRight class="cta-hover__arrow cta-hover__arrow--inline" weight="bold" />{/if}
		</span>
		{#if dot}
			<span class="cta-hover__reveal" aria-hidden="true">
				<span class="cta-hover__label">{@render children()}</span>
				<ArrowRight class="cta-hover__arrow" weight="bold" />
			</span>
		{/if}
	</a>
{:else}
	<button {type} {disabled} {onclick} class={classes}>
		<span class="cta-hover__resting">
			{#if dot}<span class="cta-hover__dot"></span>{/if}
			<span class="cta-hover__label">{@render children()}</span>
			{#if !dot}<ArrowRight class="cta-hover__arrow cta-hover__arrow--inline" weight="bold" />{/if}
		</span>
		{#if dot}
			<span class="cta-hover__reveal" aria-hidden="true">
				<span class="cta-hover__label">{@render children()}</span>
				<ArrowRight class="cta-hover__arrow" weight="bold" />
			</span>
		{/if}
	</button>
{/if}

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
	@keyframes rotate-chime {
		from {
			transform: translate(-50%, -50%) rotate(0deg);
		}
		to {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}

	.cta-hover {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 44px;
		padding: 0 24px;
		border-radius: var(--radius-lg, 8px);
		font-family: var(--font-sans);
		font-size: 14px;
		font-weight: 550;
		letter-spacing: -0.01em;
		cursor: pointer;
		overflow: hidden;
		background: transparent;
		color: var(--color-background);
		text-decoration: none;
		will-change: transform;
		transition: transform var(--duration-quick) var(--ease-smooth-out);
	}

	/* Spinning gradient circle, clipped by overflow:hidden to button shape */
	.cta-hover::before {
		content: "";
		position: absolute;
		top: 50%;
		left: 50%;
		width: max(200%, 150px);
		aspect-ratio: 1;
		border-radius: 50%;
		background: conic-gradient(
			transparent 0deg,
			transparent 220deg,
			oklch(0.65 0.2 30) 280deg,
			oklch(0.82 0.1 30) 320deg,
			transparent 360deg
		);
		transform: translate(-50%, -50%);
		animation: rotate-chime 5s linear infinite;
		pointer-events: none;
		z-index: 0;
		transition: opacity var(--duration-fast) var(--ease-smooth-out);
	}

	:global(.dark) .cta-hover::before {
		background: conic-gradient(
			transparent 0deg,
			transparent 220deg,
			oklch(0.78 0.08 40) 280deg,
			oklch(0.88 0.04 40) 320deg,
			transparent 360deg
		);
	}

	/* Inner fill: leaves 1.5px border gap showing the spinning gradient */
	.cta-hover::after {
		content: "";
		position: absolute;
		inset: 1.5px;
		border-radius: calc(var(--radius-lg, 8px) - 1.5px);
		background: var(--color-foreground);
		z-index: 1;
		pointer-events: none;
	}

	/* 40px, between 44px and 32px, for a CTA in a condensed bar. 32px is too
	   small to read as the main action, so only the label shrinks, to 13px. */
	.cta-hover--md {
		height: 40px;
		padding: 0 24px;
		font-size: 13px;
	}

	.cta-hover--md .cta-hover__dot {
		width: 7px;
		height: 7px;
	}

	.cta-hover--sm {
		height: 32px;
		padding: 0 20px;
		font-size: 13px;
	}

	.cta-hover--sm .cta-hover__dot {
		width: 6px;
		height: 6px;
	}

	.cta-hover--no-beam::before {
		display: none;
	}

	.cta-hover--no-beam {
		background: var(--color-foreground);
	}

	/* No-dot variant: arrow inline, shifts right on hover */
	:global(.cta-hover__arrow--inline) {
		width: 14px;
		height: 14px;
		flex-shrink: 0;
		transition: transform var(--duration-quick) var(--ease-smooth-out);
	}

	@media (hover: hover) and (pointer: fine) {
		.cta-hover--no-dot:hover :global(.cta-hover__arrow--inline) {
			transform: translateX(3px);
		}
	}

	.cta-hover:active {
		transform: scale(0.97);
	}

	/* In flight: the label still reads, the button stops answering. */
	.cta-hover:disabled {
		opacity: 0.7;
		cursor: default;
	}

	.cta-hover:disabled:active {
		transform: none;
	}

	/* The CTA shipped with no focus ring. This is shadcn's ring-3 ring-ring/50,
	   written as a box-shadow because this component is plain CSS. */
	.cta-hover:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-ring) 50%, transparent);
	}

	.cta-hover__resting {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		transition:
			opacity var(--duration-fast) var(--ease-smooth-out),
			transform var(--duration-fast) var(--ease-smooth-out);
	}

	/* signal-600, not signal-400: the dot becomes the hover fill under a paper
	   label, and paper on signal-400 fails AA. It works in both themes. */
	.cta-hover__dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-signal-600);
		flex-shrink: 0;
		transition: transform var(--duration-fast) var(--ease-smooth-out);
	}

	.cta-hover__label {
		white-space: nowrap;
		transition:
			transform var(--duration-fast) var(--ease-smooth-out),
			opacity var(--duration-fast) var(--ease-smooth-out);
	}

	.cta-hover__reveal {
		position: absolute;
		inset: 0;
		z-index: 3;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		opacity: 0;
		transform: translateX(48px);
		transition:
			transform var(--duration-fast) var(--ease-smooth-out),
			opacity var(--duration-fast) var(--ease-smooth-out);
		/* The reveal label always lands on the signal-600 dot fill, where paper
		   clears AA at button-label sizes. */
		color: var(--color-paper);
		pointer-events: none;
	}

	:global(.cta-hover__arrow) {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	/* Coral fill, heavier than the ink default. It comes after the .dark rules
	   so one set of colors covers both themes. */
	.cta-hover--coral {
		/* Paper label on signal-600: on signal-400 it fails AA. */
		color: var(--color-paper);
	}

	.cta-hover--coral::after {
		background: var(--color-signal-600);
	}

	.cta-hover--coral.cta-hover--no-beam {
		background: var(--color-signal-600);
	}

	.cta-hover--coral::before,
	:global(.dark) .cta-hover--coral::before {
		background: conic-gradient(
			transparent 0deg,
			transparent 220deg,
			var(--color-paper) 280deg,
			var(--color-signal-200) 320deg,
			transparent 360deg
		);
	}

	/* Ink dot on coral, so hover turns the button black under a paper label
	   instead of washing it out to cream. */
	.cta-hover--coral .cta-hover__dot,
	:global(.dark) .cta-hover--coral .cta-hover__dot {
		background: var(--color-ink);
	}

	@media (hover: hover) and (pointer: fine) {
		.cta-hover:hover::before {
			opacity: 0;
		}

		.cta-hover:hover .cta-hover__dot {
			transform: scale(100);
		}

		.cta-hover:not(.cta-hover--no-dot):hover .cta-hover__resting .cta-hover__label {
			transform: translateX(48px);
			opacity: 0;
		}

		.cta-hover:not(.cta-hover--no-dot):hover .cta-hover__reveal {
			opacity: 1;
			transform: translateX(-4px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cta-hover::before {
			animation: none;
			opacity: 0;
		}
	}
</style>
