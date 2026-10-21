<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import { useStore } from "@xyflow/svelte";
import SideHandles from "#src/canvas/chrome/side-handles.svelte";
import { lodMode } from "#src/canvas/lod/lod-mode.svelte.js";
import { renderAll } from "#src/canvas/lod/render-all.svelte.js";

// Zoomed out, a card is a box at its measured size, so no arrow moves.
// Never measured, selected, dragged or exported: full.

// =========================
// TYPES
// =========================
interface Props {
	id: string;
	selected?: boolean;
	dragging?: boolean;
	/** A CSS colour: the card's own, for the box's border and icon well. */
	tone: string;
	title: string;
	/** The full card. */
	children: Snippet;
}

// =========================
// PROPS
// =========================
let { id, selected = false, dragging = false, tone, title, children }: Props = $props();

// =========================
// STATE
// =========================
const store = useStore();
const mode = lodMode(store);
let probe = $state<HTMLElement>();
// xyflow keeps the size of a card that scrolled away, so it comes back as a box.
let size = $state<{ width: number; height: number } | null>(measured());
// Plain on purpose: only the observer below reads it.
let boxed = false;

// =========================
// DERIVED
// =========================
let simple = $derived(mode.low && size !== null && !selected && !dragging && !renderAll.on);

// =========================
// EFFECTS
// =========================
// Sizes the simple box from the full card. The observer's first call carries it, so a mount forces no layout.
$effect(() => {
	const node = probe?.closest<HTMLElement>(".svelte-flow__node");
	if (!node) return;
	const observer = new ResizeObserver(([entry]) => {
		if (boxed) return;
		const box = entry.borderBoxSize[0];
		const width = Math.round(box.inlineSize);
		const height = Math.round(box.blockSize);
		if (width && height && (width !== size?.width || height !== size?.height)) size = { width, height };
	});
	observer.observe(node);
	return () => observer.disconnect();
});

// Set after the render that swaps the box in, so the read above never sees the box's own size.
$effect(() => {
	boxed = simple;
});

// =========================
// FUNCTIONS
// =========================
function measured(): { width: number; height: number } | null {
	const known = store.nodeLookup.get(id)?.measured;
	return known?.width && known.height ? { width: known.width, height: known.height } : null;
}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<span class="cv-lod-probe" bind:this={probe} hidden></span>
{#if simple && size}
	<div class="cv-lod-box" style="width: {size.width}px; height: {size.height}px; --cv-lod-tone: {tone}" data-lod="simple">
		<span class="cv-lod-well"></span>
		<span class="cv-lod-title">{title}</span>
	</div>
	<SideHandles class="cv-lod-handle" />
{:else}
	{@render children()}
{/if}

<!-- =========================== -->
<!-- STYLES -->
<!-- =========================== -->
<style>
:global([data-cv-every-card] .svelte-flow__node) {
	animation: none;
}

/* A dot on a zoomed-out box is too small to link from; unpainted, it keeps its place for the links. */
:global(.cv-lod-handle) {
	visibility: hidden;
}

/* The architecture card's own frame and layout (architecture-node.svelte), so selecting a card doesn't change how it looks. */
.cv-lod-box {
	position: relative;
	box-sizing: border-box;
	display: flex;
	align-items: flex-start;
	gap: 10px;
	overflow: hidden;
	padding: var(--card-pad, 12px);
	border: 1px solid color-mix(in oklab, var(--cv-lod-tone) 20%, transparent);
	border-radius: var(--card-radius, 12px);
	background: var(--card, var(--cv-chrome-surface, #fff));
	color: var(--cv-ink, var(--foreground, #1a1a1f));
	contain: strict;
}

/* The icon well, without the icon. */
.cv-lod-well {
	flex: none;
	width: 32px;
	height: 32px;
	border-radius: 9999px;
	background: color-mix(in oklab, var(--cv-lod-tone) 10%, transparent);
}

.cv-lod-title {
	overflow: hidden;
	font-size: 14px;
	font-weight: 500;
	line-height: 1.25;
	overflow-wrap: anywhere;
}
</style>
