<script lang="ts">
	import type { Snippet } from "svelte";
	import { Plus } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import { Button } from "#src/shadcn/button/index.js";
	import CountChip from "#src/components/work-parts/count-chip.svelte";

	interface Props {
		label: string;
		/** The status colour of the dot. Leave out for no dot. */
		hue?: string;
		count: number;
		/** Shows a plus at the end that adds an item to this group. */
		onAdd?: () => void;
		addLabel?: string;
		/** Extra controls before the plus. */
		children?: Snippet;
		class?: string;
	}

	let { label, hue, count, onAdd, addLabel = "Add", children, class: className }: Props = $props();
</script>

<!-- A group's head, the same in a kanban column and a list group: dot, name, count, plus. -->
<div class={cn("flex h-8 min-w-0 flex-1 items-center gap-2", className)}>
	{#if hue}
		<span class="size-2 shrink-0 rounded-full" style:background={hue} aria-hidden="true"></span>
	{/if}
	<span class="truncate text-sm font-medium text-foreground">{label}</span>
	<CountChip {count} />
	{#if children || onAdd}
		<span class="ms-auto flex shrink-0 items-center gap-0.5">
			{@render children?.()}
			{#if onAdd}
				<Button
					variant="ghost"
					size="sm"
					icon
					aria-label="{addLabel}: {label}"
					class="text-muted-foreground"
					onclick={onAdd}
				>
					<Plus weight="bold" aria-hidden="true" />
				</Button>
			{/if}
		</span>
	{/if}
</div>
