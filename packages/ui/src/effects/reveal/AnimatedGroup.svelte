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
	interface AnimatedGroupProps extends RevealTiming, RevealViewOptions {
		children: Snippet;
		/** Tag to render. Default `div`. */
		as?: string;
		class?: string;
		/** Play on mount instead of waiting for the group to scroll into view. */
		onMount?: boolean;
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
		stagger,
		once = true,
		amount,
		margin,
		onMount = false,
	}: AnimatedGroupProps = $props();

	// =========================
	// STATE
	// =========================
	let rootEl = $state<HTMLElement | null>(null);
	let inView = $state(false);

	// =========================
	// DERIVED
	// =========================
	let styleVars = $derived(
		[
			delay !== undefined && `--hr-reveal-delay:${delay}ms`,
			duration !== undefined && `--hr-reveal-duration:${duration}ms`,
			stagger !== undefined && `--hr-reveal-stagger:${stagger}ms`,
		]
			.filter(Boolean)
			.join(";"),
	);

	// =========================
	// EFFECTS
	// =========================
	// WHY: children arrive as an opaque snippet, so the stagger index is stamped on
	// the rendered elements, and MutationObserver reindexes when `{#each}` changes.
	$effect(() => {
		if (!rootEl) return;
		const el = rootEl;
		const index = () => {
			Array.from(el.children).forEach((child, i) => {
				child.classList.add("hr-reveal__item");
				(child as HTMLElement).style.setProperty("--i", String(i));
			});
		};
		index();
		const mutations = new MutationObserver(index);
		mutations.observe(el, { childList: true });
		return () => mutations.disconnect();
	});

	$effect(() => {
		if (onMount) {
			inView = true;
			return;
		}
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
	class={cn("hr-reveal", className)}
	style={styleVars}
	data-preset={preset}
	data-reveal={inView ? "in" : undefined}
>
	{@render children()}
</svelte:element>
