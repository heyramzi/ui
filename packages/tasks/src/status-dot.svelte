<script lang="ts">
	import { cn } from "@heyramzi/utils";
	import { TONE_COLOR } from "@heyramzi/ui/lib/tone.js";
	import type { StatusDotVariant, Statuses } from "./status-types.js";

	interface Props {
		/** A registry from `defineStatuses`. Resolves color, variant and progress. */
		statuses?: Statuses;
		status?: string;
		/** Explicit color, overrides the registry and tone. */
		color?: string;
		variant?: StatusDotVariant;
		progress?: number;
		size?: number;
		animate?: boolean;
		class?: string;
	}

	let {
		statuses,
		status,
		color,
		variant,
		progress,
		size = 14,
		animate = true,
		class: className,
	}: Props = $props();

	const INNER_R = 2;
	const INNER_CIRC = 2 * Math.PI * INNER_R;

	function clamp01(n: number): number {
		return Math.max(0, Math.min(1, n));
	}

	let resolvedColor = $derived(
		color ??
			(statuses && status ? statuses.color(status) : undefined) ??
			(statuses && status ? TONE_COLOR[statuses.tone(status)] : undefined) ??
			TONE_COLOR.neutral,
	);
	let resolvedVariant = $derived(
		variant ?? (statuses && status ? statuses.variant(status) : "open"),
	);
	let resolvedProgress = $derived(
		progress ?? (statuses && status ? statuses.progress(status) : undefined),
	);
	let fraction = $derived(
		resolvedVariant === "progress" && typeof resolvedProgress === "number"
			? clamp01(resolvedProgress)
			: undefined,
	);
	let dasharray = $derived(
		fraction != null
			? `${INNER_CIRC * fraction} ${INNER_CIRC * (1 - fraction)}`
			: undefined,
	);
	let dashoffset = $derived(fraction != null ? INNER_CIRC * 0.25 : undefined);
</script>

{#if resolvedVariant === "completed"}
	<svg
		width={size}
		height={size}
		viewBox="0 0 14 14"
		fill="none"
		aria-hidden="true"
		class={cn("sd", className)}
	>
		<circle cx="7" cy="7" r="6" fill={resolvedColor} class={animate ? "sd-pop" : ""}></circle>
		<polyline
			points="4.5,7 6.5,9 9.5,5"
			fill="none"
			class={cn("sd-mark", animate && "sd-check")}
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		></polyline>
	</svg>
{:else if resolvedVariant === "lost"}
	<svg
		width={size}
		height={size}
		viewBox="0 0 14 14"
		fill="none"
		aria-hidden="true"
		class={cn("sd", className)}
	>
		<circle cx="7" cy="7" r="6" fill={resolvedColor} class={animate ? "sd-pop" : ""}></circle>
		<g class="sd-mark" stroke-width="1.5" stroke-linecap="round">
			<line x1="5" y1="5" x2="9" y2="9" class={animate ? "sd-cross" : ""}></line>
			<line x1="9" y1="5" x2="5" y2="9" class={animate ? "sd-cross sd-cross-second" : ""}></line>
		</g>
	</svg>
{:else if resolvedVariant === "filled"}
	<svg
		width={size}
		height={size}
		viewBox="0 0 14 14"
		fill="none"
		aria-hidden="true"
		class={cn("sd", className)}
	>
		<circle cx="7" cy="7" r="6" fill={resolvedColor} class={animate ? "sd-pop" : ""}></circle>
	</svg>
{:else}
	<svg
		width={size}
		height={size}
		viewBox="0 0 14 14"
		fill="none"
		aria-hidden="true"
		class={cn("sd", className)}
	>
		<circle
			cx="7"
			cy="7"
			r="5.5"
			stroke={resolvedColor}
			stroke-width="1.5"
			class={resolvedVariant === "dashed" ? "sd-dashed" : ""}
		></circle>
		{#if dasharray}
			<circle
				cx="7"
				cy="7"
				r={INNER_R}
				fill="none"
				stroke={resolvedColor}
				stroke-width="4"
				stroke-dasharray={dasharray}
				stroke-dashoffset={dashoffset}
				transform="rotate(-90 7 7)"
				class={animate ? "sd-fill" : ""}
			></circle>
		{/if}
	</svg>
{/if}

<style>
	.sd {
		flex-shrink: 0;
	}

	/* The tick and cross read as cut out of the disc. A host sets the mark to its own ground. */
	.sd-mark {
		stroke: var(--status-dot-mark, white);
	}

	/* 12 dashes that close evenly: 2 * PI * 5.5 = 34.56, cut into 12 periods of 2.88. */
	.sd-dashed {
		stroke-dasharray: 1.3 1.58;
	}

	.sd-fill {
		transform-origin: 7px 7px;
		animation: sd-fill-in var(--duration-slow, 320ms) var(--ease-smooth-out, ease-out) forwards;
	}

	@keyframes sd-fill-in {
		from {
			transform: rotate(-90deg) scale(0.4);
			opacity: 0;
		}
		to {
			transform: rotate(-90deg) scale(1);
			opacity: 1;
		}
	}

	.sd-pop {
		transform-origin: 7px 7px;
		animation: sd-pop-in var(--duration-medium, 240ms) var(--ease-smooth-out, ease-out) forwards;
	}

	@keyframes sd-pop-in {
		from {
			transform: scale(0.4);
			opacity: 0;
		}
		60% {
			transform: scale(1.08);
			opacity: 1;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.sd-check {
		stroke-dasharray: 12;
		stroke-dashoffset: 12;
		animation: sd-trace var(--duration-medium, 240ms) var(--ease-smooth-out, ease-out)
			var(--duration-quick, 120ms) forwards;
	}

	.sd-cross {
		stroke-dasharray: 6;
		stroke-dashoffset: 6;
		animation: sd-trace calc(var(--duration-fast, 160ms) / 2) var(--ease-smooth-out, ease-out)
			var(--duration-quick, 120ms) forwards;
	}

	.sd-cross-second {
		animation-delay: calc(var(--duration-quick, 120ms) + var(--duration-fast, 160ms) / 2);
	}

	@keyframes sd-trace {
		to {
			stroke-dashoffset: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sd-fill,
		.sd-pop,
		.sd-check,
		.sd-cross {
			animation: none;
		}
		.sd-check,
		.sd-cross {
			stroke-dashoffset: 0;
		}
	}
</style>
