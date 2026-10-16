<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export interface ConversationEmptyStateProps extends HTMLAttributes<HTMLDivElement> {
		title?: string;
		description?: string;
		icon?: Snippet;
		children?: Snippet;
		class?: string;
	}
</script>

<script lang="ts">
	import { cn } from "@heyramzi/utils";

	let {
		class: className,
		title,
		description,
		icon,
		children,
		...rest
	}: ConversationEmptyStateProps = $props();
</script>

<div
	class={cn("flex size-full flex-col items-center justify-center gap-3 p-6 text-center", className)}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		{#if icon}
			<div class="text-[color:var(--muted-foreground,inherit)]">
				{@render icon()}
			</div>
		{/if}
		<div class="space-y-1">
			{#if title}<h3 class="text-sm font-medium">{title}</h3>{/if}
			{#if description}
				<p class="text-[color:var(--muted-foreground,inherit)] text-sm">{description}</p>
			{/if}
		</div>
	{/if}
</div>
