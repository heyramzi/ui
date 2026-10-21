<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/effects/marquee/Marquee.css";
	import { cn } from "#src/lib/utils.js";
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
		/** Scroll speed in px/s. Sets the loop time from the measured track, and wins over `duration`. */
		speed?: number;
		/** Fades both ends along the scroll axis. Any CSS length, such as `16px` or `13%`. */
		fade?: string;
		/** Waits this many ms before the first scroll starts. */
		delay?: number;
		/**
		 * Scrolls only while the content is longer than the box, for a line of text with a max width.
		 * The box shrinks to its content, drops its padding, and shows one still copy when it fits.
		 */
		overflowOnly?: boolean;
		style?: string;
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
		speed,
		fade,
		delay,
		overflowOnly = false,
		style,
	}: MarqueeProps = $props();

	// =========================
	// STATE
	// =========================
	let rootEl = $state<HTMLDivElement | null>(null);
	let isVisible = $state(true);
	let tabActive = $state(true);
	let boxSize = $state(0);
	let trackSize = $state(0);
	let gapSize = $state(0);

	// =========================
	// DERIVED
	// =========================
	// WHY: pause the scroll whenever it can't be seen, so an offscreen or
	// background-tab marquee stops burning paint/compositor budget.
	let paused = $derived(!isVisible || !tabActive);

	// WHY: the 0.5px slack absorbs the rounding between a fractional text width and its box.
	let overflowing = $derived(trackSize > boxSize + 0.5);
	let still = $derived(overflowOnly && !overflowing);
	// WHY: two copies loop seamlessly once one copy is wider than the box.
	let copies = $derived(overflowOnly ? (overflowing ? 2 : 1) : repeat);
	let loopSeconds = $derived(
		speed && trackSize > 0 ? (trackSize + gapSize) / speed : undefined,
	);

	// WHY: only emit the CSS vars that were passed as props, so a consumer can
	// still override timing or spacing with a `[--duration:24s]` utility class.
	let styleVars = $derived(
		[
			loopSeconds ? `--duration:${loopSeconds}s` : duration && `--duration:${duration}`,
			gap && `--gap:${gap}`,
			fade && `--marquee-fade:${fade}`,
			delay && `--marquee-delay:${delay}ms`,
			style,
		]
			.filter(Boolean)
			.join(";"),
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
		const firstTrack = rootEl?.firstElementChild;
		if (!rootEl || !firstTrack || !(speed || overflowOnly)) return;
		const root = rootEl;
		const measure = () => {
			const computed = getComputedStyle(root);
			const box = root.getBoundingClientRect();
			const track = firstTrack.getBoundingClientRect();
			const padStart = parseFloat(vertical ? computed.paddingTop : computed.paddingLeft) || 0;
			const padEnd = parseFloat(vertical ? computed.paddingBottom : computed.paddingRight) || 0;
			boxSize = (vertical ? box.height : box.width) - padStart - padEnd;
			trackSize = vertical ? track.height : track.width;
			gapSize = parseFloat(vertical ? computed.rowGap : computed.columnGap) || 0;
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(root);
		observer.observe(firstTrack);
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
	data-overflow-only={overflowOnly ? "" : undefined}
	data-still={still ? "" : undefined}
	data-fade={fade && !still ? "" : undefined}
>
	{#each Array(copies).fill(0) as _, i (i)}
		<div
			class={cn("marquee__track", reverse && "marquee__track--reverse")}
			aria-hidden={i > 0 ? "true" : undefined}
		>
			{@render children?.()}
		</div>
	{/each}
</div>
