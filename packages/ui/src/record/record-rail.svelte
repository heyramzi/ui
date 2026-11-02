<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import { cn } from "#src/lib/utils.js";
	import * as Tabs from "#src/shadcn/tabs/index.js";

	// =========================
	// TYPES
	// =========================
	export interface RecordRailTab {
		id: string;
		label: string;
		/** Drawn beside the label, such as the number of comments. Hidden at 0 or when left out. */
		count?: number;
		content: Snippet;
	}

	interface Props {
		tabs: RecordRailTab[];
		/** The open tab's id. Defaults to the first tab. */
		value?: string;
		/** Names the tab list for a screen reader, such as "Task sidebar". */
		label: string;
		class?: string;
		/** Classes for the strip that holds the tab list. */
		listClass?: string;
		/** Classes for each tab's panel. */
		contentClass?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		tabs,
		value = $bindable(),
		label,
		class: className,
		listClass,
		contentClass,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	// WHY a fallback and not a write: the caller may hand over a new tab set where the open id is gone.
	let open = $derived(tabs.some((tab) => tab.id === value) ? value : tabs[0]?.id);
</script>

<!-- A record's side rail with tabs: the fields in one, a thread or a log in the next,
     so the thread sits beside the record and not a screen below it. One tab draws no strip. -->
<Tabs.Root value={open} onValueChange={(next) => (value = next)} class={cn("min-w-0 gap-0", className)}>
	{#if tabs.length > 1}
		<div class={cn("pb-3", listClass)}>
			<Tabs.List size="sm" class="w-full" aria-label={label}>
				{#each tabs as tab (tab.id)}
					<Tabs.Trigger value={tab.id}>
						{tab.label}
						{#if tab.count}
							<span class="text-xs tabular-nums text-muted-foreground">{tab.count}</span>
						{/if}
					</Tabs.Trigger>
				{/each}
			</Tabs.List>
		</div>
	{/if}
	{#each tabs as tab (tab.id)}
		<Tabs.Content value={tab.id} class={cn("min-w-0", contentClass)}>
			{@render tab.content()}
		</Tabs.Content>
	{/each}
</Tabs.Root>
