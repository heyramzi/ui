<script lang="ts">
	import type { LoadedExample } from "#lib/examples/index.js";
	import { SegmentedFilter } from "@heyramzi/ui/components/segmented";
	import { Check, Copy } from "phosphor-svelte";

	// Viewer's slimmer sibling for one named example: no replay, and Copy takes this file alone.
	let { example }: { example: LoadedExample } = $props();

	const views = [
		{ value: "preview", label: "Preview" },
		{ value: "code", label: "Code" },
	] as const;

	let tab = $state<(typeof views)[number]["value"]>("preview");
	let copied = $state(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(example.source);
		} catch {
			return;
		}
		copied = true;
		setTimeout(() => (copied = false), 1600);
	}
</script>

<div class="overflow-hidden rounded-(--radius-xl) border border-border">
	<header class="flex h-11 items-center gap-2 border-b border-border bg-muted/40 px-1.5">
		<SegmentedFilter
			options={views}
			bind:value={tab}
			ariaLabel="{example.title} view"
			block={false}
		/>
		<button
			type="button"
			class="ml-auto flex h-8 items-center gap-1.5 rounded-(--radius-lg) px-2.5 text-[13px] font-medium text-muted-foreground transition-colors duration-(--duration-quick) hover:bg-muted hover:text-foreground"
			onclick={copy}
		>
			{#if copied}<Check class="size-4 text-emerald-500" aria-hidden="true" /> Copied{:else}<Copy
					class="size-4"
					aria-hidden="true"
				/> Copy{/if}
		</button>
	</header>

	{#if tab === "preview"}
		<div class="grid min-h-44 place-items-center overflow-x-auto bg-card px-4 py-8 sm:px-10">
			<div class="flex w-full justify-center">
				<example.component />
			</div>
		</div>
	{:else}
		{#await import("#lib/ViewerCode.svelte") then { default: ViewerCode }}
			<ViewerCode source={example.source} height={176} />
		{/await}
	{/if}
</div>
