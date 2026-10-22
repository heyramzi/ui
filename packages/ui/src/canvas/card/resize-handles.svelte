<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { NodeResizeControl, ResizeControlVariant, useSvelteFlow } from "@xyflow/svelte";
	import { getDiagramEditorContext } from "#src/canvas/editor/editor-context.js";
	import {
		DEFAULT_MAX_WIDTH,
		DEFAULT_MIN_HEIGHT,
		DEFAULT_MIN_WIDTH,
		keptHeight,
		type CardResize,
	} from "#src/canvas/card/resize.js";
	import "#src/canvas/card/card.css";

	// The grips of a selected card. One drag is one undo step: width, kept height and extra data close together.

	// =========================
	// TYPES
	// =========================
	interface Props {
		id: string;
		resize: CardResize;
		/** The framed element, read for the height its content needs. */
		frame?: HTMLElement;
	}

	// =========================
	// CONSTANTS
	// =========================
	const CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
	const EDGES = ["left", "right", "top", "bottom"] as const;
	const SIDES = ["left", "right"] as const;

	// =========================
	// PROPS
	// =========================
	let { id, resize, frame }: Props = $props();

	// =========================
	// STATE
	// =========================
	const editor = getDiagramEditorContext();
	const { updateNode } = useSvelteFlow();
	let endGesture: (() => void) | null = null;
	// The height the content needs, read when a drag starts.
	let contentHeight = $state(DEFAULT_MIN_HEIGHT);

	// =========================
	// DERIVED
	// =========================
	let both = $derived(resize.axes === "both");
	let ratio = $derived(resize.axes === "ratio");
	let direction = $derived(both || ratio ? undefined : ("horizontal" as const));
	let box = $derived(resize.store === "box");
	let minWidth = $derived(resize.minWidth ?? DEFAULT_MIN_WIDTH);
	let maxWidth = $derived(resize.maxWidth ?? DEFAULT_MAX_WIDTH);
	let minHeight = $derived(both && !box ? contentHeight : (resize.minHeight ?? DEFAULT_MIN_HEIGHT));

	// =========================
	// FUNCTIONS
	// =========================
	function measureContent() {
		if (!frame) return;
		// With the saved floor dropped, the frame is as tall as the content needs.
		frame.setAttribute("data-resizing", "");
		contentHeight = Math.max(DEFAULT_MIN_HEIGHT, Math.ceil(frame.offsetHeight));
	}

	function start() {
		endGesture = editor?.startGesture() ?? null;
		if (both && !box) measureContent();
	}

	function finish(size: { width: number; height: number }) {
		frame?.removeAttribute("data-resizing");
		const width = Math.round(size.width);
		if (!box) {
			editor?.setNodeWidth(id, width);
			const patch: Record<string, unknown> = {
				...resize.extraData?.({ width, height: size.height }),
			};
			// A text card keeps growing with its words, and an image's height follows its width.
			if (both) patch.userHeight = keptHeight(size.height, contentHeight);
			if (Object.keys(patch).length > 0) editor?.patchNodeData(id, patch);
			// The drag gave the node a height; the content and the saved floor size it from here.
			updateNode(id, { height: undefined });
		}
		endGesture?.();
		endGesture = null;
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#snippet control(
	position: (typeof CORNERS)[number] | (typeof EDGES)[number],
	variant: ResizeControlVariant,
)}
	<NodeResizeControl
		nodeId={id}
		{position}
		{variant}
		{minWidth}
		{maxWidth}
		{minHeight}
		keepAspectRatio={ratio}
		resizeDirection={direction}
		class={variant === ResizeControlVariant.Line
			? "cv-edge"
			: direction
				? "cv-grip cv-grip-x"
				: "cv-grip"}
		onResizeStart={start}
		onResizeEnd={(_, size) => finish(size)}
	/>
{/snippet}

<!-- A text card moves only sideways, so it gets a grip on each side edge and no corners. -->
{#each both || ratio ? EDGES : SIDES as edge (edge)}
	{#if !ratio}
		{@render control(edge, ResizeControlVariant.Line)}
	{/if}
{/each}
{#each direction ? SIDES : CORNERS as grip (grip)}
	{@render control(grip, ResizeControlVariant.Handle)}
{/each}
