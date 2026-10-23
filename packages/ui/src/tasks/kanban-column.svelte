<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "#src/lib/utils.js";

	interface Props extends HTMLAttributes<HTMLDivElement> {
		/** Any CSS color. Only shows while a card is held over the column. */
		hue?: string;
		active?: boolean;
		collapsing?: boolean;
		expanding?: boolean;
		ariaLabel?: string;
		header: Snippet;
		children: Snippet;
		ondragover?: (e: DragEvent) => void;
		ondragleave?: (e: DragEvent) => void;
		ondrop?: (e: DragEvent) => void;
		class?: string;
		bodyClass?: string;
	}

	let {
		hue,
		active = false,
		collapsing = false,
		expanding = false,
		ariaLabel,
		header,
		children,
		ondragover,
		ondragleave,
		ondrop,
		class: className,
		bodyClass,
		...restProps
	}: Props = $props();

	// A column rests neutral. Its hue shows only while a card is held over it.
	let style = $derived(
		hue && active
			? `background: color-mix(in oklch, ${hue} 8%, var(--color-muted, transparent)); outline: 1px solid color-mix(in oklch, ${hue} 30%, transparent);`
			: undefined,
	);
</script>

<div
	{...restProps}
	class={cn(
		"kanban-column flex flex-col gap-2",
		collapsing && "kanban-column-collapsing",
		expanding && "kanban-column-expanding",
		!collapsing && !expanding && "w-[280px] shrink-0 min-h-0 max-sm:w-[82vw] max-sm:snap-start",
		className,
	)}
>
	<div
		role="region"
		aria-label={ariaLabel}
		class={cn(
			"flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overflow-x-hidden rounded-xl bg-muted/50 p-1.5 outline-offset-[-1px] transition-[background-color,outline-color] duration-[var(--duration-quick,120ms)] ease-[var(--ease-smooth-out,ease-out)] dark:bg-muted/30",
			bodyClass,
		)}
		{style}
		{ondragover}
		{ondragleave}
		{ondrop}
	>
		<div class="flex h-8 min-w-0 shrink-0 items-center gap-2 px-1.5">
			{@render header()}
		</div>
		{@render children()}
	</div>
</div>

<style>
	.kanban-column {
		transition: opacity var(--duration-quick, 120ms) var(--ease-smooth-out, ease-out);
	}

	.kanban-column-collapsing,
	.kanban-column-expanding {
		will-change: opacity;
	}

	.kanban-column-collapsing {
		flex: 0 0 0px;
		width: 0;
		opacity: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.kanban-column-expanding {
		flex: 0 0 280px;
		width: 280px;
		animation: column-expand var(--duration-slow, 300ms) var(--ease-smooth-out, ease-out) both;
	}

	@keyframes column-expand {
		from {
			opacity: 0;
			flex: 0 0 0px;
			width: 0;
		}
		to {
			opacity: 1;
			flex: 0 0 280px;
			width: 280px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.kanban-column-expanding {
			animation: none;
		}
	}
</style>
