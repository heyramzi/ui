<script lang="ts">
	import type { Component } from "svelte";

	// A demo that loads its code only once it nears the viewport, inside a box that holds its
	// final height from the first paint, so nothing below it moves when it arrives.
	interface Props {
		load: () => Promise<{ default: Component }>;
		/** The demo's height once loaded, px. The placeholder takes the same box. */
		height: number;
		/** Names the demo for the loading and error states. */
		label: string;
		class?: string;
	}

	let { load, height, label, class: className = "" }: Props = $props();

	let box: HTMLDivElement;
	let Demo = $state<Component | null>(null);
	let failed = $state(false);

	function start() {
		failed = false;
		load().then(
			(mod) => (Demo = mod.default),
			() => (failed = true),
		);
	}

	$effect(() => {
		// Until the first scroll only a box already on screen loads, so the first load carries
		// the fold and nothing else: a 600px lead from the start pulled in the canvas, the chart
		// and the editor on a 900px screen. Once someone scrolls, boxes load 600px ahead, so the
		// chunk is usually in before the box scrolls in.
		let observer: IntersectionObserver | undefined;
		const watch = (rootMargin: string) => {
			observer?.disconnect();
			observer = new IntersectionObserver(
				(seen) => {
					if (!seen.some((e) => e.isIntersecting)) return;
					stop();
					start();
				},
				{ rootMargin },
			);
			observer.observe(box);
		};
		const lookAhead = () => watch("600px 0px");
		const stop = () => {
			observer?.disconnect();
			window.removeEventListener("scroll", lookAhead);
		};
		watch("0px");
		window.addEventListener("scroll", lookAhead, { once: true, passive: true });
		return stop;
	});
</script>

<div bind:this={box} class="relative w-full {className}" style:min-height="{height}px">
	{#if Demo}
		<div class="lazy-in flex w-full justify-center"><Demo /></div>
	{:else if failed}
		<div class="absolute inset-0 grid place-items-center">
			<p class="text-sm text-muted-foreground">
				{label} didn't load.
				<button
					type="button"
					class="t-press font-medium text-foreground underline underline-offset-4"
					onclick={start}>Try again</button
				>
			</p>
		</div>
	{:else}
		<div class="lazy-wait absolute inset-0 rounded-(--radius-lg)" role="status">
			<span class="sr-only">Loading {label}</span>
		</div>
	{/if}
</div>

<style>
	.lazy-wait {
		background: color-mix(in oklab, var(--foreground) 4%, transparent);
		animation: wait calc(var(--duration-loop) * 2) var(--ease-in-out) infinite alternate;
	}
	.lazy-in {
		animation: arrive var(--duration-slow) var(--ease-smooth-out) both;
	}
	@keyframes wait {
		to {
			opacity: 0.45;
		}
	}
	@keyframes arrive {
		from {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.lazy-wait,
		.lazy-in {
			animation: none;
		}
	}
</style>
