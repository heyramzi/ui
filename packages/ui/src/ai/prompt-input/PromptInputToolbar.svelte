<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export interface PromptInputToolbarProps extends HTMLAttributes<HTMLDivElement> {
		class?: string;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "@heyramzi/utils";

	let { class: className, children, ...rest }: PromptInputToolbarProps = $props();
</script>

<div class={cn("flex items-center justify-between gap-2 px-2 py-1.5", className)} {...rest}>
	{@render children?.()}
</div>
