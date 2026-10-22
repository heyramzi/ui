<script lang="ts" generics="TGroup">
	// =========================
	// IMPORTS
	// =========================
	import { untrack, type Snippet } from "svelte";
	import { SvelteSet } from "svelte/reactivity";
	import { CaretDown } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		groups: TGroup[];
		getKey: (group: TGroup) => string;
		defaultCollapsed?: string[];
		/** WHY: a page that drives its own keyboard cursor has to know which rows
		    are on screen, and the collapsed set is the only thing that says so. */
		onCollapsedChange?: (keys: string[]) => void;
		header: Snippet<[TGroup, { collapsed: boolean }]>;
		/** Controls beside the header, outside its toggle button so a click on
		    one doesn't collapse the group. Shown on hover of the header row. */
		actions?: Snippet<[TGroup]>;
		rows: Snippet<[TGroup]>;
		class?: string;
		onGroupDragOver?: (e: DragEvent, group: TGroup) => void;
		onGroupDragLeave?: (e: DragEvent) => void;
		onGroupDrop?: (e: DragEvent, group: TGroup) => void;
	}

	// =========================
	// PROPS
	// =========================
	let {
		groups,
		getKey,
		defaultCollapsed = [],
		onCollapsedChange,
		header,
		actions,
		rows,
		class: className,
		onGroupDragOver,
		onGroupDragLeave,
		onGroupDrop,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	const collapsed = new SvelteSet<string>(untrack(() => defaultCollapsed));

	// =========================
	// FUNCTIONS
	// =========================
	function toggle(key: string) {
		if (collapsed.has(key)) {
			collapsed.delete(key);
		} else {
			collapsed.add(key);
		}
		onCollapsedChange?.([...collapsed]);
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class={cn("flex w-full flex-col", className)}>
	{#each groups as group, index (getKey(group))}
		{@const key = getKey(group)}
		{@const isCollapsed = collapsed.has(key)}
		<div
			class={cn(index > 0 && "mt-3 border-t border-border/50 pt-3")}
			role={onGroupDragOver || onGroupDrop ? "group" : undefined}
			ondragover={onGroupDragOver ? (e) => onGroupDragOver(e, group) : undefined}
			ondragleave={onGroupDragLeave}
			ondrop={onGroupDrop ? (e) => onGroupDrop(e, group) : undefined}
		>
			<div
				class="group/header flex items-center gap-1 rounded-lg transition-colors hover:bg-muted/60"
			>
				<button
					type="button"
					class="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left"
					onclick={() => toggle(key)}
					aria-expanded={!isCollapsed}
				>
					<CaretDown
						class={cn(
							"size-3 shrink-0 text-muted-foreground/60 transition-transform duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]",
							isCollapsed && "-rotate-90",
						)}
						weight="bold"
					/>
					{@render header(group, { collapsed: isCollapsed })}
				</button>
				{#if actions}
					<div
						class="flex shrink-0 items-center gap-1 pe-2 opacity-0 transition-opacity group-hover/header:opacity-100 focus-within:opacity-100 any-pointer-coarse:opacity-100"
					>
						{@render actions(group)}
					</div>
				{/if}
			</div>

			{#if !isCollapsed}
				<div>
					{@render rows(group)}
				</div>
			{/if}
		</div>
	{/each}
</div>

<!-- No entrance motion. Four stacked animations made the last group of a
     40-row board arrive two seconds late. Working surfaces don't animate in. -->
<!-- No `overflow: hidden` either: it clipped anything a row opened. -->
