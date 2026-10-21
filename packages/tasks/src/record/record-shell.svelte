<script lang="ts" generics="T extends string = string">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import { CaretRight } from "phosphor-svelte";
import { cn } from "@heyramzi/utils";
import { AnimatedTabs, type TabDef } from "@heyramzi/ui/components/segmented";
import * as Sheet from "@heyramzi/ui/shadcn/sheet";
import { Progress } from "@heyramzi/ui/shadcn/progress";
import { gutterClass } from "#src/record/gutter.js";
import { resolveLabels, type RecordLabels } from "#src/record/types.js";

// =========================
// PROPS
// =========================
interface Props {
	header: Snippet;
	/** Where we are, next up, stats: whatever sits between the header and the body. */
	banner?: Snippet;
	/** The tab row. Put each panel in a `Tabs.Content` from `@heyramzi/ui/shadcn/tabs`. */
	tabs?: readonly TabDef<T>[];
	tab?: T;
	tabsLabel?: string;
	/** The side rail. Docked at 48rem and wider, a sheet behind one row under that. */
	rail?: Snippet;
	/** The sheet's title, read out by screen readers. Defaults to the steps label. */
	railTitle?: string;
	/** Fills the narrow row's bar. Leave it out for a row with no progress. */
	railProgress?: { done: number; total: number } | null;
	railOpen?: boolean;
	children: Snippet;
	labels?: Partial<RecordLabels>;
	class?: string;
}
let {
	header,
	banner,
	tabs,
	tab = $bindable(),
	tabsLabel,
	rail,
	railTitle,
	railProgress = null,
	railOpen = $bindable(false),
	children,
	labels,
	class: className,
}: Props = $props();

// =========================
// DERIVED
// =========================
let t = $derived(resolveLabels(labels));
let percent = $derived(
	railProgress && railProgress.total > 0 ? (railProgress.done / railProgress.total) * 100 : 0,
);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- WHY a container query: the record sits in a page with its own sidebar, so the
     viewport says nothing about how much room it has. -->
<div class={cn("@container flex min-w-0 flex-col bg-background", className)}>
	{@render header()}
	{@render banner?.()}

	{#if rail}
		<button
			type="button"
			class={cn(
				"t-press flex min-h-11 w-full items-center gap-3 border-b border-border py-2 text-left @3xl:hidden",
				gutterClass,
			)}
			aria-haspopup="dialog"
			aria-expanded={railOpen}
			onclick={() => (railOpen = true)}
		>
			<span class="text-sm font-medium">{railTitle ?? t.steps}</span>
			{#if railProgress}
				<span class="text-xs tabular-nums text-muted-foreground">
					{t.stepsCount(railProgress.done, railProgress.total)}
				</span>
				<Progress
					value={percent}
					max={100}
					class="h-1 flex-1"
					aria-label={t.stepsCount(railProgress.done, railProgress.total)}
				/>
			{:else}
				<span class="flex-1"></span>
			{/if}
			<CaretRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
		</button>
	{/if}

	<div class="flex min-w-0 flex-col @3xl:flex-row">
		<div class="min-w-0 flex-1">
			{#if tabs}
				<AnimatedTabs
					{tabs}
					bind:value={tab}
					variant="underline"
					placement="section"
					ariaLabel={tabsLabel}
					listWrapperClass={gutterClass}
					class="gap-0"
				>
					<div class={cn("py-4 @3xl:py-5", gutterClass)}>{@render children()}</div>
				</AnimatedTabs>
			{:else}
				<div class={cn("py-4 @3xl:py-5", gutterClass)}>{@render children()}</div>
			{/if}
		</div>

		{#if rail}
			<aside
				class="hidden w-72 shrink-0 self-start border-l border-border @3xl:sticky @3xl:top-0 @3xl:block @5xl:w-80"
			>
				<div class="p-4">{@render rail()}</div>
			</aside>
		{/if}
	</div>
</div>

<!-- The rail is drawn twice, once docked and once here. Only one is ever on screen,
     and the sheet mounts its copy on open. -->
{#if rail}
	<Sheet.Root bind:open={railOpen}>
		<Sheet.Content side="bottom" class="gap-0 p-0">
			<Sheet.Header class="sr-only">
				<Sheet.Title>{railTitle ?? t.steps}</Sheet.Title>
			</Sheet.Header>
			<div class="overflow-y-auto p-4 pt-6">{@render rail()}</div>
		</Sheet.Content>
	</Sheet.Root>
{/if}
