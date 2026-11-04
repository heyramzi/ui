<script lang="ts" module>
	/** DESIGN.md rule 20: a skeleton waits this long, so a fast answer never shows one. */
	export const SHOW_DELAY_MS = 150;
	/** DESIGN.md rule 20: once shown, a skeleton stays this long, so it never blinks. */
	export const MIN_VISIBLE_MS = 300;
</script>

<script lang="ts">
	import { untrack, type Snippet } from "svelte";

	interface Props {
		/** The data is on its way. */
		loading: boolean;
		/** What shows while it loads: one or more `Skeleton`s shaped like the content. */
		skeleton: Snippet;
		/** The content, drawn once loading ends and the skeleton has had its minimum time. */
		children: Snippet;
		/** Ms to wait before the skeleton shows. */
		showDelay?: number;
		/** Ms the skeleton stays once it shows. */
		minVisible?: number;
	}

	let {
		loading,
		skeleton,
		children,
		showDelay = SHOW_DELAY_MS,
		minVisible = MIN_VISIBLE_MS,
	}: Props = $props();

	// `wait` draws nothing: the first 150ms of a load, which a fast answer never leaves.
	let phase = $state<"wait" | "skeleton" | "content">(untrack(() => (loading ? "wait" : "content")));
	let shownAt = 0;

	$effect(() => {
		const isLoading = loading;
		let timer: ReturnType<typeof setTimeout> | undefined;
		untrack(() => {
			if (isLoading) {
				if (phase === "skeleton") return;
				phase = "wait";
				timer = setTimeout(() => {
					phase = "skeleton";
					shownAt = performance.now();
				}, showDelay);
			} else if (phase === "skeleton") {
				const left = minVisible - (performance.now() - shownAt);
				if (left > 0) timer = setTimeout(() => (phase = "content"), left);
				else phase = "content";
			} else {
				phase = "content";
			}
		});
		return () => clearTimeout(timer);
	});
</script>

{#if phase === "skeleton"}
	{@render skeleton()}
{:else if phase === "content"}
	{@render children()}
{/if}
