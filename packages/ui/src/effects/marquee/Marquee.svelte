<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/effects/marquee/Marquee.css";
	import { cn } from "@heyramzi/utils";
	import type { Snippet } from "svelte";

	// =========================
	// TYPES
	// =========================
	interface MarqueeProps {
		children: Snippet;
		class?: string;
		reverse?: boolean;
		pauseOnHover?: boolean;
		vertical?: boolean;
		repeat?: number;
		duration?: string;
		gap?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		children,
		class: className = "",
		reverse = false,
		pauseOnHover = false,
		vertical = false,
		repeat = 4,
		duration,
		gap,
	}: MarqueeProps = $props();

	// =========================
	// STATE
	// =========================
	let rootEl = $state<HTMLDivElement | null>(null);
	let isVisible = $state(true);
	let tabActive = $state(true);

	// =========================
	// DERIVED
	// =========================
	// WHY: pause the scroll whenever it can't be seen, so an offscreen or
	// background-tab marquee stops burning paint/compositor budget.
	let paused = $derived(!isVisible || !tabActive);

	// WHY: only emit the CSS vars that were passed as props, so a consumer can
	// still override timing or spacing with a `[--duration:24s]` utility class.
	let styleVars = $derived(
		[duration && `--duration:${duration}`, gap && `--gap:${gap}`].filter(Boolean).join(";"),
	);

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		if (!rootEl) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				isVisible = entry.isIntersecting;
			},
			{ threshold: 0 },
		);
		observer.observe(rootEl);
		return () => observer.disconnect();
	});

	$effect(() => {
		const onVisibility = () => {
			tabActive = document.visibilityState === "visible";
		};
		document.addEventListener("visibilitychange", onVisibility);
		return () => document.removeEventListener("visibilitychange", onVisibility);
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div
	bind:this={rootEl}
	class={cn("marquee", vertical && "marquee--vertical", className)}
	style={styleVars}
	data-pause-hover={pauseOnHover ? "" : undefined}
	data-paused={paused ? "" : undefined}
>
	{#each Array(repeat).fill(0) as _, i (i)}
		<div class={cn("marquee__track", reverse && "marquee__track--reverse")}>
			{@render children?.()}
		</div>
	{/each}
</div>
