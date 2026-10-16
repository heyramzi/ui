<script lang="ts">
	import { cn } from "@heyramzi/utils";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export interface SuggestionsProps extends HTMLAttributes<HTMLDivElement> {
		children?: Snippet;
		class?: string;
	}

	let { children, class: className, ...rest }: SuggestionsProps = $props();
</script>

<div
	class={cn(
		"flex w-full items-center gap-2 overflow-x-auto pb-1",
		"[&::-webkit-scrollbar]:hidden",
		"[scrollbar-width:none]",
		className,
	)}
	role="list"
	{...rest}
>
	{@render children?.()}
</div>
