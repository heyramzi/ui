<script lang="ts" module>
	import type { PenColor } from "#src/canvas/pen/types.js";
	import type { CanvasTool } from "#src/canvas/ui/tools.js";

	export interface ToolbarLabels {
		toolbar: string;
		style: string;
		tools: Record<CanvasTool, string> & { shapes: string; note: string };
		colors: Record<PenColor, string>;
		/** Small, medium, large. */
		sizes: readonly [string, string, string];
	}
</script>

<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { Panel } from "@xyflow/svelte";
	import type { Snippet } from "svelte";
	import "#src/canvas/pen/pen.css";
	import { PEN_COLORS } from "#src/canvas/pen/types.js";
	import "#src/canvas/ui/canvas-ui.css";
	import ToolIcon from "#src/canvas/components/icons/ToolIcon.svelte";
	import {
		hasBrush,
		hasColor,
		isBrushTool,
		isShapeTool,
		keyForTool,
		type BrushLevel,
		type BrushTool,
	} from "#src/canvas/ui/tools.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		tool: CanvasTool;
		color: PenColor;
		level: BrushLevel;
		labels: ToolbarLabels;
		/** The note button drops a note card, so the host owns what it does. Omit it to hide the button. */
		onNote?: () => void;
		/** Sits last on the rail, for what only the host knows, like the card palette. */
		extra?: Snippet;
	}

	// =========================
	// PROPS
	// =========================
	let {
		tool = $bindable(),
		color = $bindable(),
		level = $bindable(),
		labels,
		onNote,
		extra,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let lastShape = $state<"rectangle" | "ellipse" | "diamond">("rectangle");
	let lastBrush = $state<BrushTool>("pen");

	// =========================
	// DERIVED
	// =========================
	const BRUSHES = ["pen", "highlighter", "eraser"] as const;
	const SHAPES = ["rectangle", "ellipse", "diamond"] as const;
	const BRUSH_DOT = [4, 7, 11] as const;

	let shapeActive = $derived(isShapeTool(tool));
	let brushActive = $derived(isBrushTool(tool));
	let showStyle = $derived(brushActive || shapeActive || hasColor(tool));

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		if (isShapeTool(tool)) lastShape = tool;
		if (isBrushTool(tool)) lastBrush = tool;
	});

	// =========================
	// FUNCTIONS
	// =========================
	function tip(id: CanvasTool, label = labels.tools[id]): string {
		const key = keyForTool(id);
		return key ? `${label}  ${key}` : label;
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<Panel position="center-left" class="cv-dock">
	<div class="cv-row">
		<div
			class="cv-bar cv-rail"
			role="toolbar"
			aria-orientation="vertical"
			aria-label={labels.toolbar}
		>
			<button
				type="button"
				class="cv-btn"
				aria-pressed={tool === "select"}
				aria-label={labels.tools.select}
				data-tip={tip("select")}
				onclick={() => (tool = "select")}
			>
				<ToolIcon name="select" />
			</button>
			<button
				type="button"
				class="cv-btn"
				aria-pressed={tool === "hand"}
				aria-label={labels.tools.hand}
				data-tip={tip("hand")}
				onclick={() => (tool = "hand")}
			>
				<ToolIcon name="hand" />
			</button>
			<button
				type="button"
				class="cv-btn"
				aria-pressed={tool === "connect"}
				aria-label={labels.tools.connect}
				data-tip={tip("connect")}
				onclick={() => (tool = "connect")}
			>
				<ToolIcon name="connect" />
			</button>
			<button
				type="button"
				class="cv-btn"
				aria-pressed={brushActive}
				aria-label={labels.tools[lastBrush]}
				data-tip={tip(lastBrush)}
				onclick={() => (tool = lastBrush)}
			>
				<ToolIcon name={brushActive ? (tool as BrushTool) : lastBrush} />
			</button>
			<button
				type="button"
				class="cv-btn"
				aria-pressed={tool === "text"}
				aria-label={labels.tools.text}
				data-tip={tip("text")}
				onclick={() => (tool = "text")}
			>
				<ToolIcon name="text" />
			</button>
			<button
				type="button"
				class="cv-btn"
				aria-pressed={shapeActive}
				aria-label={labels.tools.shapes}
				data-tip={tip("rectangle", labels.tools.shapes)}
				onclick={() => (tool = lastShape)}
			>
				<ToolIcon name={shapeActive ? (tool as typeof lastShape) : lastShape} />
			</button>
			<button
				type="button"
				class="cv-btn"
				aria-pressed={tool === "frame"}
				aria-label={labels.tools.frame}
				data-tip={tip("frame")}
				onclick={() => (tool = "frame")}
			>
				<ToolIcon name="frame" />
			</button>
			{#if onNote}
				<button
					type="button"
					class="cv-btn"
					aria-label={labels.tools.note}
					data-tip="{labels.tools.note}  N"
					onclick={onNote}
				>
					<ToolIcon name="note" />
				</button>
			{/if}

			{#if extra}
				<span class="cv-gap" aria-hidden="true"></span>
				{@render extra()}
			{/if}
		</div>

		{#if showStyle}
			<div class="cv-bar t-enter" role="toolbar" aria-label={labels.style}>
				{#if brushActive}
					{#each BRUSHES as brush (brush)}
						<button
							type="button"
							class="cv-btn"
							aria-pressed={tool === brush}
							aria-label={labels.tools[brush]}
							data-tip={tip(brush)}
							onclick={() => (tool = brush)}
						>
							<ToolIcon name={brush} />
						</button>
					{/each}
				{:else if shapeActive}
					{#each SHAPES as shape (shape)}
						<button
							type="button"
							class="cv-btn"
							aria-pressed={tool === shape}
							aria-label={labels.tools[shape]}
							data-tip={tip(shape)}
							onclick={() => (tool = shape)}
						>
							<ToolIcon name={shape} />
						</button>
					{/each}
				{/if}

				{#if hasColor(tool)}
					{#if brushActive || shapeActive}<span class="cv-gap" aria-hidden="true"></span>{/if}
					{#each PEN_COLORS as swatch (swatch)}
						<button
							type="button"
							class="cv-swatch"
							aria-pressed={color === swatch}
							aria-label={labels.colors[swatch]}
							data-tip={labels.colors[swatch]}
							style:--swatch="var(--pen-{swatch})"
							onclick={() => (color = swatch)}
						></button>
					{/each}
				{/if}

				{#if hasBrush(tool)}
					<span class="cv-gap" aria-hidden="true"></span>
					{#each BRUSH_DOT as dot, index (index)}
						<button
							type="button"
							class="cv-btn"
							aria-pressed={level === index}
							aria-label={labels.sizes[index]}
							data-tip={labels.sizes[index]}
							onclick={() => (level = index as BrushLevel)}
						>
							<span class="cv-dot" style:--dot="{dot}px"></span>
						</button>
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</Panel>
