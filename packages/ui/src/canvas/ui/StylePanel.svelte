<script lang="ts" module>
import type { PenColor } from "#src/canvas/pen/types.js";

export interface StyleLabels {
	panel: string;
	fill: string;
	stroke: string;
	/** The stroke row's name when the selection has no outline, only ink, like text. */
	colour: string;
	none: string;
	width: string;
	/** Thin, regular, thick. */
	widths: readonly [string, string, string];
	font: string;
	regular: string;
	bold: string;
	colors: Record<PenColor, string>;
}
</script>

<script lang="ts">
// =========================
// IMPORTS
// =========================
import { Panel, useStore } from "@xyflow/svelte";
import type { CanvasOp } from "#src/canvas/ops/ops.js";
import {
	FONT_SIZES,
	styleOps,
	summarizeStyle,
	type FontWeight,
	type StyleNode,
	type StyleValues,
	type WidthLevel,
} from "#src/canvas/editor/style.js";
import { PEN_COLORS } from "#src/canvas/pen/types.js";
import "#src/canvas/pen/pen.css";
import { placeBeside, type Box } from "#src/canvas/ui/place-panel.js";
import "#src/canvas/ui/canvas-ui.css";

// =========================
// TYPES
// =========================
interface Props {
	/** The selected cards. The panel hides when none of them takes a style. */
	nodes: readonly StyleNode[];
	/** The node type of a frame or group, whose fill and outline the panel sets. */
	frameType?: string;
	labels: StyleLabels;
	/** One call per change, so each is one undo step. */
	commit: (ops: CanvasOp[]) => void;
}

// =========================
// PROPS
// =========================
let { nodes, frameType = "group", labels, commit }: Props = $props();

// =========================
// STATE
// =========================
const store = useStore();
let barWidth = $state(0);
let barHeight = $state(0);

// =========================
// DERIVED
// =========================
const WEIGHTS: readonly FontWeight[] = ["regular", "bold"];
const LEVELS: readonly WidthLevel[] = [0, 1, 2];

let summary = $derived(summarizeStyle(nodes, frameType));
let strokeLabel = $derived(summary?.controls.has("fill") || summary?.controls.has("width") ? labels.stroke : labels.colour);

// The selection in screen pixels, read from the live viewport so the panel follows a pan, a zoom and a drag.
let selection = $derived.by<Box | null>(() => {
	const { x, y, zoom } = store.viewport;
	let box: Box | null = null;
	for (const node of nodes) {
		const internal = store.nodeLookup.get(node.id);
		if (!internal) continue;
		const at = internal.internals.positionAbsolute;
		const width = internal.measured.width ?? internal.width ?? 0;
		const height = internal.measured.height ?? internal.height ?? 0;
		const left = at.x * zoom + x;
		const top = at.y * zoom + y;
		const right = left + width * zoom;
		const bottom = top + height * zoom;
		box = box
			? { left: Math.min(box.left, left), top: Math.min(box.top, top), right: Math.max(box.right, right), bottom: Math.max(box.bottom, bottom) }
			: { left, top, right, bottom };
	}
	return box;
});

// Beside the selection on the side with room, never over its grips. Null leaves the panel docked at the right edge.
let placed = $derived(
	selection && barWidth > 0
		? placeBeside(selection, { width: barWidth, height: barHeight }, { width: store.width, height: store.height })
		: null,
);

// =========================
// FUNCTIONS
// =========================
function change(next: Partial<StyleValues>) {
	const ops = styleOps(nodes, next, frameType);
	if (ops.length > 0) commit(ops);
}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if summary}
	<Panel
		position="center-right"
		class="cv-dock cv-style-dock {placed ? 'is-placed' : ''}"
		style={placed ? `--cv-style-x:${Math.round(placed.x)}px;--cv-style-y:${Math.round(placed.y)}px` : undefined}
		data-side={placed?.side}
	>
		<div
			bind:offsetWidth={barWidth}
			bind:offsetHeight={barHeight}
			class="cv-bar cv-side cv-style t-enter" role="toolbar" aria-label={labels.panel} data-testid="style-panel">
			{#if summary.controls.has("fill")}
				<div class="cv-section" role="group" aria-label={labels.fill} data-testid="style-fill">
					<span class="cv-label" aria-hidden="true">{labels.fill}</span>
					<div class="cv-swatches">
						<button
							type="button"
							class="cv-swatch cv-swatch-none"
							aria-pressed={summary.values.fill === "none"}
							aria-label="{labels.fill}: {labels.none}"
							data-tip={labels.none}
							onclick={() => change({ fill: "none" })}
						></button>
						{#each PEN_COLORS as swatch (swatch)}
							<button
								type="button"
								class="cv-swatch"
								aria-pressed={summary.values.fill === swatch}
								aria-label="{labels.fill}: {labels.colors[swatch]}"
								data-tip={labels.colors[swatch]}
								style:--swatch="var(--pen-{swatch})"
								onclick={() => change({ fill: swatch })}
							></button>
						{/each}
					</div>
				</div>
			{/if}

			{#if summary.controls.has("stroke")}
				<div class="cv-section" role="group" aria-label={strokeLabel} data-testid="style-stroke">
					<span class="cv-label" aria-hidden="true">{strokeLabel}</span>
					<div class="cv-swatches">
						{#each PEN_COLORS as swatch (swatch)}
							<button
								type="button"
								class="cv-swatch"
								aria-pressed={summary.values.stroke === swatch}
								aria-label="{strokeLabel}: {labels.colors[swatch]}"
								data-tip={labels.colors[swatch]}
								style:--swatch="var(--pen-{swatch})"
								onclick={() => change({ stroke: swatch })}
							></button>
						{/each}
					</div>
				</div>
			{/if}

			{#if summary.controls.has("width")}
				<div class="cv-section" role="group" aria-label={labels.width} data-testid="style-width">
					<span class="cv-label" aria-hidden="true">{labels.width}</span>
					<div class="cv-swatches">
						{#each LEVELS as level (level)}
							<button
								type="button"
								class="cv-btn"
								aria-pressed={summary.values.width === level}
								aria-label="{labels.width}: {labels.widths[level]}"
								data-tip={labels.widths[level]}
								onclick={() => change({ width: level })}
							>
								<span class="cv-line" style:--line="{[1.5, 3, 5][level]}px"></span>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if summary.controls.has("fontSize")}
				<div class="cv-section" role="group" aria-label={labels.font} data-testid="style-font">
					<span class="cv-label" aria-hidden="true">{labels.font}</span>
					<div class="cv-swatches">
						{#each FONT_SIZES as size (size)}
							<button
								type="button"
								class="cv-btn cv-figure"
								aria-pressed={summary.values.fontSize === size}
								aria-label="{labels.font}: {size}"
								onclick={() => change({ fontSize: size })}
							>{size}</button>
						{/each}
						{#each WEIGHTS as weight (weight)}
							<button
								type="button"
								class="cv-btn cv-figure"
								style:font-weight={weight === "bold" ? 700 : 400}
								aria-pressed={summary.values.fontWeight === weight}
								aria-label={weight === "bold" ? labels.bold : labels.regular}
								data-tip={weight === "bold" ? labels.bold : labels.regular}
								onclick={() => change({ fontWeight: weight })}
							>Aa</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</Panel>
{/if}

<style>
	.cv-style {
		flex-direction: column;
		align-items: stretch;
		gap: 8px;
		padding: 8px;
	}

	.cv-section {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.cv-label {
		padding-inline: 4px;
		color: var(--cv-ink-muted);
		font-size: 12px;
		line-height: 16px;
	}

	.cv-swatches {
		display: grid;
		grid-template-columns: repeat(3, var(--cv-btn));
		gap: 0;
	}

	.cv-line {
		width: 18px;
		height: var(--line);
		border-radius: 999px;
		background: currentColor;
	}

	.cv-figure {
		font-size: 12px;
		font-variant-numeric: tabular-nums;
	}

	/* No fill is an empty disc struck through, since a swatch can't show the absence of a colour. */
	.cv-swatch-none::before {
		background:
			linear-gradient(135deg, transparent 46%, var(--cv-ink-muted) 46% 54%, transparent 54%),
			var(--cv-surface);
	}
</style>
