<script lang="ts" generics="TGroup">
	// =========================
	// IMPORTS
	// =========================
	import { untrack, type Snippet } from "svelte";
	import { SvelteSet } from "svelte/reactivity";
	import { CaretDown, Plus } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import CountChip from "#src/components/chip/count-chip.svelte";

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
		/** A count beside the header, in a small pill. Leave it out when the header draws its own. */
		getCount?: (group: TGroup) => number;
		/** Shows an add button at the end of the header row. */
		onAdd?: (group: TGroup) => void;
		/** The add button's accessible name. */
		addLabel?: string;
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
		getCount,
		onAdd,
		addLabel = "Add",
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
		<!-- Groups part by space, not a rule: the header band already marks where one starts
		     (DESIGN.md rule 19). -->
		<div
			class={cn(index > 0 && "mt-4")}
			role={onGroupDragOver || onGroupDrop ? "group" : undefined}
			ondragover={onGroupDragOver ? (e) => onGroupDragOver(e, group) : undefined}
			ondragleave={onGroupDragLeave}
			ondrop={onGroupDrop ? (e) => onGroupDrop(e, group) : undefined}
		>
			<!-- A quiet band, 32px like a row, so the header reads as the group's lid
			     without a border. The tint is on the foreground: bg-muted vanishes on the canvas. -->
			<div
				class="group/header hover-row flex min-h-8 items-center gap-1 rounded-lg bg-foreground/4 transition-colors duration-quick ease-smooth-out hover:bg-foreground/6 motion-reduce:transition-none any-pointer-coarse:min-h-11"
			>
				<button
					type="button"
					class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 self-stretch rounded-lg px-2.5 text-left outline-none focus-visible:shadow-[var(--ring-focus)]"
					onclick={() => toggle(key)}
					aria-expanded={!isCollapsed}
				>
					<!-- The accordion chevron: it turns on the fast step and holds still under
					     reduced motion, where the open state is aria-expanded and the rows. -->
					<CaretDown
						class={cn(
							"size-3 shrink-0 text-muted-foreground transition-transform duration-fast ease-smooth-out motion-reduce:transition-none",
							isCollapsed && "-rotate-90",
						)}
						weight="bold"
					/>
					{@render header(group, { collapsed: isCollapsed })}
					{#if getCount}
						<CountChip count={getCount(group)} />
					{/if}
				</button>
				{#if actions}
					<div class="row-action flex shrink-0 items-center gap-1 pe-1">
						{@render actions(group)}
					</div>
				{/if}
				{#if onAdd}
					<button
						type="button"
						class="t-press me-1 grid size-6 shrink-0 place-items-center rounded-sm text-muted-foreground transition-colors duration-quick ease-smooth-out outline-none hover:bg-foreground/6 hover:text-foreground focus-visible:shadow-[var(--ring-focus)] motion-reduce:transition-none any-pointer-coarse:size-11"
						aria-label={addLabel}
						onclick={() => onAdd(group)}
					>
						<Plus class="size-3.5" weight="bold" aria-hidden="true" />
					</button>
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
