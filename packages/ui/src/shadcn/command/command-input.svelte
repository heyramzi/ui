<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "@heyramzi/utils";
	import { MagnifyingGlass } from "phosphor-svelte";
	import type { Snippet } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		wrapperClass,
		size = "default",
		trailing,
		value = $bindable(""),
		...restProps
		// WHY Omit: the HTML input `size` attribute is a character count, and the
		// intersection with it collapses this union to never.
	}: Omit<CommandPrimitive.InputProps, "size"> & {
		/** Classes for the row that holds the glyph, the field and `trailing`. */
		wrapperClass?: string;
		/** `lg` is the standalone search header; `default` is a combobox popover. */
		size?: "default" | "lg";
		/** Right-aligned affordances: a dismiss hint, a close button, a scope chip. */
		trailing?: Snippet;
	} = $props();
</script>

<div
	data-slot="command-input-wrapper"
	class={cn(
		"border-border/70 flex items-center gap-2.5 border-b",
		size === "lg" ? "px-4" : "px-3",
		wrapperClass,
	)}
>
	<MagnifyingGlass size={size === "lg" ? 18 : 16} class="text-muted-foreground shrink-0" />
	<CommandPrimitive.Input
		data-slot="command-input"
		class={cn(
			// WHY the caret: it is the one part of a search field the browser draws, and its default belongs to no theme.

			// Brand indigo on the blinking cursor is the cheapest signal that the field was designed. WHY the ring is refused here and nowhere else: the craft layer draws

			// one focus ring on every `input` at specificity zero, and this field has no edge of its own to redraw.

			// It got a rounded accent box floating inside a popover that was already the focused surface, on every combobox and on the palette itself.

			// The caret carries focus instead, which is why it is brand indigo two lines down.
			"focus-visible:shadow-none",
			"caret-brand-indigo placeholder:text-muted-foreground/70 w-full bg-transparent outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
			// A combobox popover's search line is 36px, measured; `lg` is the
			// standalone palette header and keeps its own larger rhythm.
			size === "lg" ? "py-3.5 text-[15px]" : "py-2 text-[13px]",
			className,
		)}
		bind:ref
		{...restProps}
		bind:value
	/>
	{#if trailing}
		<div class="flex shrink-0 items-center gap-1.5">
			{@render trailing()}
		</div>
	{/if}
</div>
