<script lang="ts">
	import type { Entry } from "#lib/registry.js";
	import { copyAiContext } from "#lib/ai-context.js";
	import { SegmentedFilter } from "@heyramzi/ui/components/segmented";
	import { ArrowCounterClockwise, Check, Copy } from "phosphor-svelte";

	let { entry, link = false }: { entry: Entry; link?: boolean } = $props();

	const views = [
		{ value: "preview", label: "Preview" },
		{ value: "code", label: "Code" },
	] as const;

	let tab = $state<(typeof views)[number]["value"]>("preview");
	let run = $state(0);
	let copied = $state(false);

	// One button, the full block: usage and component source. A person pastes the
	// part they want, an agent gets everything.
	async function copy() {
		if (await copyAiContext(entry)) {
			copied = true;
			setTimeout(() => (copied = false), 1600);
		}
	}
</script>

<!-- One border, no shadow, no pattern: the demo is the only thing on the stage. The toolbar is
     a strip of the same surface, split from it by a hairline. -->
<section id={entry.slug} class="overflow-hidden rounded-(--radius-xl) border border-border">
	<header class="flex h-11 items-center gap-2 border-b border-border bg-muted/40 pl-1.5 pr-1.5">
		<SegmentedFilter options={views} bind:value={tab} ariaLabel="View" block={false} />
		{#if link}
			<a href="/components/{entry.slug}" class="ml-1 text-sm font-medium hover:underline"
				>{entry.title}</a
			>
		{/if}
		<div class="ml-auto flex items-center gap-0.5">
			<button
				type="button"
				class="grid size-8 place-items-center rounded-(--radius-lg) text-muted-foreground transition-colors duration-(--duration-quick) hover:bg-muted hover:text-foreground"
				aria-label="Replay"
				title="Replay"
				onclick={() => run++}
			>
				<ArrowCounterClockwise class="size-4" />
			</button>
			<button
				type="button"
				class="flex h-8 items-center gap-1.5 rounded-(--radius-lg) px-2.5 text-[13px] font-medium text-muted-foreground transition-colors duration-(--duration-quick) hover:bg-muted hover:text-foreground"
				onclick={copy}
			>
				{#if copied}<Check class="size-4 text-emerald-500" /> Copied{:else}<Copy class="size-4" /> Copy{/if}
			</button>
		</div>
	</header>

	{#if tab === "preview"}
		<div
			class="grid place-items-center overflow-x-auto bg-background px-4 py-10 sm:px-10 sm:py-12"
			style="min-height:{entry.height ?? 240}px"
		>
			{#key run}
				<div class="w-full">
					<div class="mx-auto flex w-full justify-center">
						<entry.component />
					</div>
				</div>
			{/key}
		</div>
	{:else}
		{#await import("#lib/ViewerCode.svelte") then { default: ViewerCode }}
			<ViewerCode source={entry.source} height={entry.height ?? 240} />
		{/await}
	{/if}
</section>
