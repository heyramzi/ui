<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/effects/reveal/reveal.css";
	import { cn } from "@heyramzi/utils";
	import { observeInView } from "#src/effects/reveal/observe.js";
	import type { RevealPer, RevealTiming, RevealViewOptions } from "#src/effects/reveal/types.js";

	// =========================
	// TYPES
	// =========================
	interface TextEffectProps extends RevealTiming, RevealViewOptions {
		/** The line to reveal. Plain text only; `\n` splits lines when `per="line"`. */
		text: string;
		/** What one staggered step is. Default `word`. */
		per?: RevealPer;
		/** Tag to render. Default `p`. */
		as?: string;
		class?: string;
		/** Play on mount instead of waiting for the text to scroll into view. */
		onMount?: boolean;
	}

	type Token =
		| { kind: "plain"; text: string }
		| { kind: "item"; text: string; i: number; block: boolean }
		| { kind: "word"; chars: Array<{ text: string; i: number }> };

	// =========================
	// CONSTANTS
	// =========================
	const DEFAULT_STAGGER: Record<RevealPer, number> = { char: 25, word: 40, line: 80 };

	// =========================
	// PROPS
	// =========================
	let {
		text,
		per = "word",
		as = "p",
		class: className,
		preset = "fade",
		delay,
		duration,
		stagger,
		once = true,
		amount,
		margin,
		onMount = false,
	}: TextEffectProps = $props();

	// =========================
	// STATE
	// =========================
	let rootEl = $state<HTMLElement | null>(null);
	let inView = $state(false);

	// =========================
	// DERIVED
	// =========================
	let tokens = $derived(split(text, per));

	let styleVars = $derived(
		[
			delay !== undefined && `--hr-reveal-delay:${delay}ms`,
			duration !== undefined && `--hr-reveal-duration:${duration}ms`,
			`--hr-reveal-stagger:${stagger ?? DEFAULT_STAGGER[per]}ms`,
		]
			.filter(Boolean)
			.join(";"),
	);

	// =========================
	// FUNCTIONS
	// =========================
	function split(value: string, mode: RevealPer): Token[] {
		if (mode === "line") {
			return value.split("\n").map((line, i) => ({ kind: "item", text: line, i, block: true }));
		}

		// WHY: the capturing split keeps the whitespace runs as their own pieces, so
		// spacing survives without any piece being animated.
		let i = 0;
		return value.split(/(\s+)/).flatMap<Token>((piece) => {
			if (piece === "") return [];
			if (/^\s+$/.test(piece)) return [{ kind: "plain", text: piece }];
			if (mode === "word") return [{ kind: "item", text: piece, i: i++, block: false }];
			return [{ kind: "word", chars: Array.from(piece).map((c) => ({ text: c, i: i++ })) }];
		});
	}

	// =========================
	// EFFECTS
	// =========================
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
	{#if per !== "line"}
		<!-- The split spans are decorative; a screen reader gets the whole line once. -->
		<span class="hr-reveal__sr">{text}</span>
	{/if}
	{#each tokens as token, t (t)}
		{#if token.kind === "plain"}
			<span class="hr-reveal__segment">{token.text}</span>
		{:else if token.kind === "item"}
			<span
				aria-hidden={per === "line" ? undefined : "true"}
				class={cn(
					"hr-reveal__segment",
					token.block && "hr-reveal__segment--line",
					"hr-reveal__item",
				)}
				style="--i:{token.i}">{token.text}</span
			>
		{:else}<span class="hr-reveal__segment" aria-hidden="true"
				>{#each token.chars as char, c (c)}<span
						class="hr-reveal__segment hr-reveal__item"
						style="--i:{char.i}">{char.text}</span
					>{/each}</span
			>
		{/if}
	{/each}
</svelte:element>
