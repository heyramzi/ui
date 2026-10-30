<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { X } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";

	interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, "class" | "children"> {
		/** A leading mark: a tag icon, a colour dot, an avatar. */
		icon?: Snippet;
		/** Shows a remove button after the label. */
		onremove?: () => void;
		/** The remove button's accessible name. */
		removeLabel?: string;
		/**
		 * False keeps the remove button out of the tab order and stops it taking focus on press,
		 * for a chip inside a field whose input owns the keyboard (Backspace removes).
		 */
		removeFocusable?: boolean;
		children?: Snippet;
		class?: string;
	}

	let {
		icon,
		onremove,
		removeLabel = "Remove",
		removeFocusable = true,
		children,
		class: className,
		...restProps
	}: Props = $props();
</script>

<!-- A tag is a label the user wrote, not a state, so it's a bordered grey rectangle at the chip
     radius and never a pill (DESIGN.md rules 2 and 15). -->
<span
	data-slot="tag-chip"
	class={cn(
		"inline-flex h-5 max-w-full shrink-0 items-center gap-1 overflow-hidden rounded-sm border border-border bg-muted/60 px-1.5 text-xs text-foreground",
		"[&>svg]:size-3 [&>svg]:shrink-0 [&>svg]:text-muted-foreground",
		onremove && "pr-0.5",
		className,
	)}
	{...restProps}
>
	{@render icon?.()}
	<span class="min-w-0 truncate">{@render children?.()}</span>
	{#if onremove}
		<!-- The glyph is 12px; the after: box takes the hit area to 24px without growing the chip. -->
		<button
			type="button"
			class="relative grid size-4 shrink-0 place-items-center rounded-sm text-muted-foreground transition-colors duration-quick ease-smooth-out after:absolute after:-inset-1 hover:bg-foreground/8 hover:text-foreground focus-visible:shadow-[var(--ring-focus)] focus-visible:outline-none motion-reduce:transition-none"
			aria-label={removeLabel}
			tabindex={removeFocusable ? undefined : -1}
			onmousedown={(e) => {
				if (!removeFocusable) e.preventDefault();
			}}
			onclick={onremove}
		>
			<X class="size-3" weight="bold" />
		</button>
	{/if}
</span>
