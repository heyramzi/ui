<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import { getDiagramEditorContext } from "#src/canvas/editor/editor-context.js";
import { isLocked } from "#src/canvas/editor/lock.js";
import { userHeightOf, type CardResize } from "#src/canvas/card/resize.js";
import ResizeHandles from "#src/canvas/card/resize-handles.svelte";
import "#src/canvas/card/card.css";

// The frame every card sits in: it keeps the saved height as a floor and draws the grips
// on a selected card. A card whose policy is `false` has neither.

// =========================
// TYPES
// =========================
interface Props {
	id: string;
	data?: unknown;
	selected?: boolean;
	/** How this card type resizes, or false when its size isn't the person's to set. */
	resize: CardResize | false;
	children: Snippet;
}

// =========================
// PROPS
// =========================
let { id, data, selected = false, resize, children }: Props = $props();

// =========================
// STATE
// =========================
const editor = getDiagramEditorContext();
let frame = $state<HTMLElement>();

// =========================
// DERIVED
// =========================
let floor = $derived(userHeightOf(data));
// A box card is sized by the node itself, so it needs no frame.
let framed = $derived(!!resize && resize.store !== "box");
let grips = $derived(!!resize && !!editor && selected && !isLocked({ data }));
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- The grips come first, so a link dot on the same edge stays on top of them. -->
{#if resize && grips}
	<ResizeHandles {id} {resize} {frame} />
{/if}

{#if framed}
	<div class="cv-card-frame" bind:this={frame} style:--cv-card-h={floor > 0 ? `${floor}px` : undefined}>
		{@render children()}
	</div>
{:else}
	{@render children()}
{/if}
