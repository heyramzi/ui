<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/effects/reveal/reveal.css";
	import { cn } from "@heyramzi/utils";
	import type { Snippet } from "svelte";
	import { observeInView } from "#src/effects/reveal/observe.js";
	import type { RevealTiming, RevealViewOptions } from "#src/effects/reveal/types.js";

	// =========================
	// TYPES
	// =========================
	interface InViewProps extends RevealTiming, RevealViewOptions {
		children: Snippet<[boolean]>;
		/** Tag to render. Default `div`. */
		as?: string;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		children,
		as = "div",
		class: className,
		preset = "fade",
		delay,
		duration,
		once = true,
		amount,
		margin,
	}: InViewProps = $props();

	// =========================
	// STATE
	// =========================
	let rootEl = $state<HTMLElement | null>(null);
	let inView = $state(false);

	// =========================
	// DERIVED
	// =========================
	// WHY: emit only the props that were passed, so a `[--hr-reveal-blur:4px]`
	// utility on the consumer's class still wins.
	let styleVars = $derived(
		[
			delay !== undefined && `--hr-reveal-delay:${delay}ms`,
			duration !== undefined && `--hr-reveal-duration:${duration}ms`,
		]
			.filter(Boolean)
			.join(";"),
	);

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		if (!rootEl) return;
		return observeInView(rootEl, { once, amount, margin }, (v) => (inView = v));
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<svelte:element
	this={as}
	bind:this={rootEl}
	class={cn("hr-reveal hr-reveal__item", className)}
	style={styleVars}
	data-preset={preset}
	data-reveal={inView ? "in" : undefined}
>
	{@render children(inView)}
</svelte:element>
