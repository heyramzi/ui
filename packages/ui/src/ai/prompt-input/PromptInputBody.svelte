<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export interface PromptInputBodyProps extends HTMLAttributes<HTMLDivElement> {
		class?: string;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "@heyramzi/utils";

	let { class: className, children, ...rest }: PromptInputBodyProps = $props();
</script>

<div class={cn("flex flex-col", className)} {...rest}>
	{@render children?.()}
</div>
