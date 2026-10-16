<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { Collapsible as CollapsiblePrimitive } from "bits-ui";

	export interface ReasoningTriggerProps extends CollapsiblePrimitive.TriggerProps {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "@heyramzi/utils";
	import BrainIcon from "phosphor-svelte/lib/Brain";
	import ChevronDownIcon from "phosphor-svelte/lib/CaretDown";
	import { CollapsibleTrigger } from "#src/shadcn/collapsible/index.js";
	import { getReasoningContext } from "#src/ai/reasoning/reasoning-context.svelte.js";

	let { class: className, children, ...rest }: ReasoningTriggerProps = $props();

	const ctx = getReasoningContext();

	const label = $derived(
		ctx.isStreaming
			? "Thinking..."
			: ctx.duration > 0
				? `Thought for ${ctx.duration}s`
				: "Reasoning",
	);
</script>

<CollapsibleTrigger
	class={cn(
		"group flex w-full items-center gap-2 text-left",
		"text-sm text-[color:var(--muted-foreground,#71717a)]",
		"transition-colors hover:text-[color:var(--foreground,#09090b)]",
		className,
	)}
	{...rest}
>
	<BrainIcon class={cn("size-4 shrink-0", ctx.isStreaming && "animate-pulse")} />
	{#if children}
		{@render children()}
	{:else}
		<span>{label}</span>
	{/if}
	<ChevronDownIcon
		class="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
	/>
</CollapsibleTrigger>
