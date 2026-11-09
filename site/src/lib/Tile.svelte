<script lang="ts">
	import type { Entry } from "#lib/registry.js";
	import { copyAiContext } from "#lib/ai-context.js";
	import { Check, Copy } from "phosphor-svelte";

	/**
	 * `crop` lays a tall demo out at the tile's own width and full size, pinned to the top, and lets
	 * the bottom fall off under a fade. Scaling a long column to fit leaves a speck.
	 */
	let { entry, crop = false }: { entry: Entry; crop?: boolean } = $props();
	let width = $state(0);
	let height = $state(0);
	let stage: HTMLDivElement;
	// Breathing room the demo keeps from the preview's edges, px.
	const inset = { x: 48, y: 48 };
	// Lay the demo out at a working width, never narrower than 480px, so a row of six chips stays
	// one row and shrinks as a whole instead of wrapping inside a narrow tile.
	const stageWidth = $derived(
		crop && width ? width - inset.x : width ? Math.min(760, Math.max(480, width - inset.x)) : 760,
	);
	// The demo's own footprint, unscaled: offset sizes ignore the CSS scale.
	let content = $state({ w: 760, h: 0 });
	let copied = $state(false);
	// Shrink a demo only as far as it needs to fit. A small one stays at full size.
	const scale = $derived(
		crop
			? 1
			: width && content.h
				? Math.min(1, (width - inset.x) / content.w, (height - inset.y) / content.h)
				: 0.46,
	);
	// The first sentence, whole. A clamp would cut it mid-word; a full paragraph makes the grid
	// ragged.
	const blurb = $derived(entry.description.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? entry.description);

	$effect(() => {
		const measure = () => {
			const kids = [...stage.children] as HTMLElement[];
			const left = Math.min(...kids.map((k) => k.offsetLeft));
			const right = Math.max(...kids.map((k) => k.offsetLeft + k.offsetWidth));
			const w = kids.length ? Math.max(1, right - left) : stageWidth;
			content = { w, h: Math.max(1, stage.offsetHeight) };
		};
		const observer = new ResizeObserver(measure);
		observer.observe(stage);
		for (const kid of stage.children) observer.observe(kid);
		measure();
		return () => observer.disconnect();
	});

	async function copy(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (await copyAiContext(entry)) {
			copied = true;
			setTimeout(() => (copied = false), 1600);
		}
	}
</script>

<!-- A div, not a link: a demo can hold its own links, and a link inside a link breaks
     hydration. One surface, one border: the preview and the caption share it, split by a
     hairline. -->
<div
	class="group relative flex min-w-0 flex-col overflow-hidden rounded-(--radius-xl) border border-border bg-card transition-[border-color] duration-(--duration-quick) hover:border-foreground/20"
>
	<div
		class="relative h-56 overflow-hidden border-b border-border bg-background"
		bind:clientWidth={width}
		bind:clientHeight={height}
	>
		<div
			class={[
				"pointer-events-none absolute left-1/2 -translate-x-1/2",
				crop
					? "top-6 bottom-0 overflow-hidden mask-b-from-60%"
					: "top-1/2 origin-center -translate-y-1/2",
			]}
			style="width:{stageWidth}px; scale:{scale}"
			aria-hidden="true"
		>
			<div class="flex w-full justify-center" bind:this={stage}>
				<entry.component />
			</div>
		</div>
		<button
			type="button"
			class="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-(--radius-lg) text-muted-foreground opacity-0 transition-[opacity,color,background-color] duration-(--duration-quick) hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
			aria-label="Copy"
			title="Copy"
			onclick={copy}
		>
			{#if copied}<Check class="size-4 text-emerald-500" />{:else}<Copy class="size-4" />{/if}
		</button>
	</div>
	<div class="flex flex-1 flex-col gap-1 px-4 py-3.5">
		<a
			href="/components/{entry.slug}"
			class="text-sm font-medium leading-5 after:absolute after:inset-0">{entry.title}</a
		>
		<p class="text-pretty text-[13px] leading-5 text-muted-foreground">{blurb}</p>
	</div>
</div>
