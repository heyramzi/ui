<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { Collapsible as CollapsiblePrimitive } from "bits-ui";

	export interface ReasoningContentProps extends CollapsiblePrimitive.ContentProps {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "@heyramzi/utils";
	import { CollapsibleContent } from "#src/shadcn/collapsible/index.js";

	let { class: className, children, ...rest }: ReasoningContentProps = $props();
</script>

<CollapsibleContent
	class={cn(
		"mt-3 border-l-2 pl-3 text-sm leading-relaxed",
		"border-[color:var(--border,rgba(0,0,0,0.1))] text-[color:var(--muted-foreground,#71717a)]",
		"overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up motion-reduce:animate-none",
		className,
	)}
	{...rest}
>
	{@render children?.()}
</CollapsibleContent>
