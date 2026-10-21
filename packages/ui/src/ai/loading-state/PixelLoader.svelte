<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	export interface PixelLoaderProps extends HTMLAttributes<HTMLDivElement> {
		/** What the agent is doing. Read out by screen readers. */
		label?: string;
		/** Show the running clock beside the label. */
		elapsed?: boolean;
		/** Seconds already spent when the loader mounts, e.g. resuming a run. */
		startSeconds?: number;
		class?: string;
	}
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import { cn } from "#src/lib/utils.js";

	let {
		label = "Working",
		elapsed = true,
		startSeconds = 0,
		class: className,
		...rest
	}: PixelLoaderProps = $props();

	// WHY nine cells and not a spinner: the grid reads as work happening in

	// parallel, which is what an agent is doing, and it stays legible at 12px where a rotating ring turns into a smudge.
	const CELLS = 9;

	// The prop seeds the clock once; after that the clock is its own.
	let seconds = $state(untrack(() => startSeconds));

	// WHY the clock lives here and not in the caller: every surface that shows

	// this loader wants the same "how long has it been" line, and a caller that forgets to tear its interval down leaks one per render.
	$effect(() => {
		if (!elapsed) return;
		const id = setInterval(() => {
			seconds += 1;
		}, 1000);
		return () => clearInterval(id);
	});

	const clock = $derived(
		seconds < 60
			? `${seconds}s`
			: `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`,
	);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div
	class={cn("pixel-loader inline-flex items-center gap-2.5", className)}
	role="status"
	aria-label={label}
	{...rest}
>
	<span class="grid shrink-0 grid-cols-3 gap-[1.5px]" aria-hidden="true">
		{#each { length: CELLS } as _, i (i)}
			<span class="cell size-[4px] rounded-[1px] bg-current" style="animation-delay: {i * 90}ms"
			></span>
		{/each}
	</span>

	<span class="shimmer text-sm font-medium">{label}</span>

	{#if elapsed}
		<span class="font-mono text-[11px] tabular-nums text-[color:var(--muted-foreground,#71717a)]">
			{clock}
		</span>
	{/if}
</div>

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
	.pixel-loader {
		color: var(--foreground, #09090b);
	}

	.cell {
		opacity: 0.15;
		animation: pixel-on 650ms ease-in-out infinite;
	}

	@keyframes pixel-on {
		0%,
		100% {
			opacity: 0.15;
		}
		50% {
			opacity: 1;
		}
	}

	/* The label carries the same wait the grid does, so the two read as one
	   object rather than as a spinner that happens to sit beside a word. */
	.shimmer {
		background: linear-gradient(
			90deg,
			var(--muted-foreground, #71717a) 0%,
			var(--foreground, #09090b) 50%,
			var(--muted-foreground, #71717a) 100%
		);
		background-size: 200% 100%;
		background-clip: text;
		-webkit-background-clip: text;
		color: transparent;
		animation: shimmer-sweep 1800ms linear infinite;
	}

	@keyframes shimmer-sweep {
		from {
			background-position: 200% 0;
		}
		to {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cell {
			animation: none;
			opacity: 0.55;
		}

		.shimmer {
			animation: none;
			background: none;
			color: var(--foreground, #09090b);
		}
	}
</style>
