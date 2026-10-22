<script lang="ts" generics="T">
	// ========================= IMPORTS
	import type { Snippet } from "svelte";
	import { Spinner } from "#src/shadcn/spinner/index.js";

	// ========================= TYPES
	interface Props {
		items: T[];
		isDone: boolean;
		isLoading: boolean;
		children: Snippet<[{ items: T[] }]>;
		/** Skeleton snippet rendered while loading more */
		skeleton?: Snippet;
		onLoadMore: () => void;
		threshold?: number;
		loadingClass?: string;
	}

	// ========================= PROPS
	let {
		items,
		isDone,
		isLoading,
		children,
		skeleton,
		onLoadMore,
		threshold = 200,
		loadingClass,
	}: Props = $props();

	// ========================= STATE
	let sentinelEl: HTMLDivElement | undefined = $state();

	// ========================= EFFECTS
	$effect(() => {
		if (!sentinelEl || isDone) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && !isLoading && !isDone) {
					onLoadMore();
				}
			},
			{ rootMargin: `${threshold}px` },
		);

		observer.observe(sentinelEl);
		return () => observer.disconnect();
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{@render children({ items })}

{#if !isDone}
	<div bind:this={sentinelEl} class={loadingClass ?? ""}>
		{#if isLoading}
			{#if skeleton}
				{@render skeleton()}
			{:else}
				<div class="flex items-center justify-center py-4">
					<Spinner class="size-5 text-muted-foreground" />
				</div>
			{/if}
		{/if}
	</div>
{/if}
