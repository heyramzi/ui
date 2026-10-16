<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/effects/magic-card/MagicCard.css";
	import { cn } from "@heyramzi/utils";
	import type { Snippet } from "svelte";

	// =========================
	// TYPES
	// =========================
	interface Props {
		children: Snippet;
		/** Draw the pointer-following glow. Off leaves the frosted card and the hover edge. */
		glow?: boolean;
		/** Glow radius in px. */
		radius?: number;
		class?: string;
		/** Classes for the padded box around the children. */
		contentClass?: string;
	}

	// =========================
	// PROPS
	// =========================
	let { children, glow = true, radius = 500, class: className, contentClass }: Props = $props();

	// =========================
	// FUNCTIONS
	// =========================
	function handlePointerMove(event: PointerEvent) {
		const card = event.currentTarget as HTMLElement;
		const rect = card.getBoundingClientRect();
		card.style.setProperty("--magic-card-x", `${event.clientX - rect.left}px`);
		card.style.setProperty("--magic-card-y", `${event.clientY - rect.top}px`);
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div
	role="group"
	onpointermove={glow ? handlePointerMove : undefined}
	style:--magic-card-radius="{radius}px"
	class={cn(
		"magic-card relative overflow-hidden rounded-lg border border-border/50 bg-card/85 shadow-xs backdrop-blur-md [--magic-card-strength:6%] dark:border-border/40 dark:bg-card/70 dark:[--magic-card-strength:10%]",
		className,
	)}
>
	{#if glow}
		<div class="magic-card__glow" aria-hidden="true"></div>
	{/if}
	<div class={cn("relative z-[1] p-6", contentClass)}>
		{@render children()}
	</div>
</div>
