<script lang="ts" module>
	export interface GenerationSteps {
		completed: number;
		total: number;
		currentStep?: string;
	}

	// No `variant` prop: bar, card and inline drew the same four facts three ways.
	export interface GenerationProgressProps {
		status: "idle" | "generating" | "failed";
		progress?: GenerationSteps | null;
		label?: string;
		showElapsed?: boolean;
		class?: string;
	}
</script>

<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { cn } from "#src/lib/utils.js";

	// =========================
	// PROPS
	// =========================
	let {
		status,
		progress = null,
		label,
		showElapsed = false,
		class: className,
	}: GenerationProgressProps = $props();

	// =========================
	// STATE
	// =========================
	let elapsed = $state(0);

	// =========================
	// DERIVED
	// =========================
	let heading = $derived(label || "Generating");
	let percent = $derived(
		progress && progress.total > 0 ? (progress.completed / progress.total) * 100 : 0,
	);

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		if (!showElapsed || status !== "generating") {
			elapsed = 0;
			return;
		}

		const interval = setInterval(() => {
			elapsed += 1;
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<!-- ===========================
     MARKUP
     =========================== -->
{#if status === "failed"}
	<div class={cn("gen gen-failed", className)}>
		<div class="gen-head">
			<span class="gen-dot"></span>
			<span class="gen-label">Generation failed</span>
		</div>
	</div>
{:else if status === "generating"}
	<div class={cn("gen", className)}>
		<div class="gen-head">
			<span class="gen-dot"></span>
			<!-- data-text carries the same string for the shimmer's ::before layer. -->
			<span class="gen-label t-shimmer" data-text={heading}>{heading}</span>
			<span class="gen-meta">
				{#if progress}
					<span class="gen-count">
						<!-- #key is the reflow: Svelte drops the node and builds a new one,
						     which is what replays the pop-in on every step. -->
						{#key progress.completed}
							<span class="t-digit-group is-animating"
								><span class="t-digit">{progress.completed}</span></span
							>
						{/key}<span class="gen-total">/{progress.total}</span>
					</span>
				{/if}
				{#if showElapsed}
					<span class="gen-elapsed">{elapsed}s</span>
				{/if}
			</span>
		</div>

		<div class="gen-track" data-indeterminate={progress ? undefined : true}>
			<div
				class="gen-fill"
				style:transform={progress ? `scaleX(${percent / 100})` : undefined}
			></div>
		</div>

		{#if progress?.currentStep}
			{#key progress.currentStep}
				<p class="gen-step">{progress.currentStep}</p>
			{/key}
		{/if}
	</div>
{/if}

<!-- ===========================
     STYLE
     =========================== -->
<style>
	/* ── Surface ─────────────────────────────────────────── */
	.gen {
		--shimmer-dur: 2200ms;
		--shimmer-base: var(--color-brand);
		/* The band is darker than the base on a pale tint and lighter on ink.
		   Otherwise the sweep looks like the label dropping out. */
		--shimmer-highlight: color-mix(in oklab, black 45%, var(--color-brand));
		--shimmer-band: 400%;
		--shimmer-ease: linear;
		--digit-dur: var(--duration-very-slow);
		--digit-distance: var(--distance-base);
		--digit-blur: var(--blur-small);
		--digit-ease: var(--ease-smooth-out);
		--digit-dir-x: 0;
		--digit-dir-y: 1;

		padding: 0.625rem 0.875rem;
		border-radius: var(--radius-lg);
		background: color-mix(in oklab, var(--color-brand) 10%, transparent);
	}

	:global(.dark) .gen {
		--shimmer-highlight: color-mix(in oklab, white 70%, var(--color-brand));
	}

	.gen-failed {
		--shimmer-base: var(--color-destructive);
		background: color-mix(in oklab, var(--color-destructive) 10%, transparent);
	}

	.gen-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.gen-dot {
		flex: none;
		width: 0.375rem;
		height: 0.375rem;
		border-radius: 9999px;
		background: var(--color-brand);
		animation: gen-pulse 1.8s var(--ease-in-out, ease-in-out) infinite;
	}

	.gen-failed .gen-dot {
		background: var(--color-destructive);
		animation: none;
	}

	.gen-label {
		margin-inline-end: auto;
		font-size: 0.75rem;
		font-weight: 500;
		line-height: 1.4;
	}

	/* signal-600, not --color-destructive: that token is tuned for fills, and at
	   L=0.6 small text on the pale tint fails. Dark mode uses the lighter step. */
	.gen-failed .gen-label {
		color: var(--color-signal-600);
	}

	:global(.dark) .gen-failed .gen-label {
		color: var(--color-signal-400);
	}

	.gen-meta {
		display: flex;
		align-items: baseline;
		gap: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		color: var(--color-brand);
	}

	.gen-count {
		display: inline-flex;
		align-items: baseline;
	}

	.gen-total,
	.gen-elapsed {
		opacity: 0.6;
	}

	/* ── Track ───────────────────────────────────────────── */
	.gen-track {
		position: relative;
		overflow: hidden;
		margin-top: 0.5rem;
		height: 0.25rem;
		border-radius: 9999px;
		background: color-mix(in oklab, var(--color-brand) 22%, transparent);
	}

	.gen-fill {
		width: 100%;
		height: 100%;
		transform-origin: left;
		border-radius: 9999px;
		background: var(--color-brand);
		transition: transform var(--duration-slow, 400ms) var(--ease-smooth-out, ease);
	}

	/* A job with no step count still has to look like it is running, so the fill
	   becomes a band that sweeps instead of a length that grows. */
	.gen-track[data-indeterminate] .gen-fill {
		width: 38%;
		transition: none;
		animation: gen-sweep 1.5s var(--ease-in-out, ease-in-out) infinite;
	}

	.gen-step {
		margin: 0.375rem 0 0;
		overflow: hidden;
		font-size: 0.75rem;
		line-height: 1.5;
		white-space: nowrap;
		text-overflow: ellipsis;
		/* Mix toward the foreground, not transparent: a 70% indigo wash on its
		   own track measured 2.9:1. This stays quieter than the label and AA. */
		color: color-mix(in oklab, var(--color-brand) 70%, var(--color-foreground));
		animation: gen-step-in var(--duration-quick, 150ms) var(--ease-in-out, ease-in-out) both;
	}

	@keyframes gen-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.35;
		}
	}

	@keyframes gen-sweep {
		0% {
			translate: -110% 0;
		}
		100% {
			translate: 290% 0;
		}
	}

	@keyframes gen-step-in {
		from {
			opacity: 0;
			transform: translateY(var(--distance-micro, 4px));
			filter: blur(var(--blur-small, 2px));
		}
		to {
			opacity: 1;
			transform: none;
			filter: blur(0);
		}
	}

	/* ── transitions.dev: shimmer text ───────────────────── */
	.t-shimmer {
		position: relative;
		display: inline-block;
		color: var(--shimmer-base);
	}
	.t-shimmer::before {
		content: attr(data-text);
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image: linear-gradient(
			90deg,
			transparent 0%,
			transparent 40%,
			var(--shimmer-highlight) 50%,
			transparent 60%,
			transparent 100%
		);
		background-size: var(--shimmer-band) 100%;
		background-repeat: no-repeat;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		-webkit-text-fill-color: transparent;
		animation: t-shimmer var(--shimmer-dur) var(--shimmer-ease) infinite;
	}
	@keyframes t-shimmer {
		0% {
			background-position: 100% 0;
		}
		100% {
			background-position: 0% 0;
		}
	}

	/* ── transitions.dev: number pop-in ──────────────────── */
	@keyframes t-digit-pop-in {
		0% {
			transform: translate(
				calc(var(--digit-distance) * var(--digit-dir-x)),
				calc(var(--digit-distance) * var(--digit-dir-y))
			);
			opacity: 0;
			filter: blur(var(--digit-blur));
		}
		100% {
			transform: translate(0, 0);
			opacity: 1;
			filter: blur(0);
		}
	}

	.t-digit-group {
		display: inline-flex;
		align-items: baseline;
	}
	.t-digit {
		display: inline-block;
		will-change: transform, opacity, filter;
	}
	.t-digit-group.is-animating .t-digit {
		animation: t-digit-pop-in var(--digit-dur) var(--digit-ease) both;
	}

	@media (prefers-reduced-motion: reduce) {
		.t-shimmer::before {
			animation: none !important;
		}
		.t-digit-group.is-animating .t-digit,
		.gen-dot,
		.gen-step {
			animation: none;
		}
		.gen-track[data-indeterminate] .gen-fill {
			width: 100%;
			animation: none;
			opacity: 0.5;
		}
		.gen-fill {
			transition: none;
		}
	}
</style>
