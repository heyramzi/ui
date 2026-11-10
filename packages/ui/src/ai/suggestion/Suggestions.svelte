<script lang="ts">
	import { cn } from "#src/lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export interface SuggestionsProps extends HTMLAttributes<HTMLDivElement> {
		children?: Snippet;
		/** The group's name for a screen reader. */
		label?: string;
		class?: string;
	}

	let { children, label = "Suggestions", class: className, ...rest }: SuggestionsProps = $props();
</script>

<div
	class={cn(
		"flex w-full items-center gap-2 overflow-x-auto pb-1",
		"[&::-webkit-scrollbar]:hidden",
		"[scrollbar-width:none]",
		className,
	)}
	role="group"
	aria-label={label}
	{...rest}
>
	{@render children?.()}
</div>
