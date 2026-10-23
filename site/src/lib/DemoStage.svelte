<script lang="ts">
	import type { Snippet } from "svelte";

	// One labelled demo inside a demo that stacks several: a name, a line on what it shows, the
	// import it needs and an optional replay for one that animates once.
	interface Props {
		title: string;
		note?: string;
		importPath?: string;
		onaction?: () => void;
		actionLabel?: string;
		children: Snippet;
	}

	let { title, note, importPath, onaction, actionLabel = "Replay", children }: Props = $props();
</script>

<article class="rounded-xl border border-border bg-card/50">
	<header
		class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-dashed border-border px-4 py-3"
	>
		<div class="min-w-0">
			<h3 class="text-sm font-medium">{title}</h3>
			{#if note}<p class="text-[13px] text-muted-foreground">{note}</p>{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if onaction}
				<button
					type="button"
					class="rounded-lg border border-border bg-card px-2.5 py-1 text-xs"
					onclick={onaction}>{actionLabel}</button
				>
			{/if}
			{#if importPath}<code
					class="rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground"
					>{importPath}</code
				>{/if}
		</div>
	</header>
	<div class="flex min-h-28 items-center justify-center p-6">{@render children()}</div>
</article>
