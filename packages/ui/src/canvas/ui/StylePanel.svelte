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
	import { Toolbar } from "bits-ui";
	import type { CanvasOp } from "#src/canvas/ops/ops.js";
	import {
		FONT_SIZES,
		styleOps,
		summarizeStyle,
		type FillValue,
		type FontWeight,
		type StyleNode,
		type StyleValues,
		type WidthLevel,
	} from "#src/canvas/editor/style.js";
	import { PEN_COLORS } from "#src/canvas/pen/types.js";
	import "#src/canvas/pen/pen.css";
	import BarTooltip from "#src/canvas/ui/BarTooltip.svelte";
	import { placeBeside, type Box } from "#src/canvas/ui/place-panel.js";
	import "#src/canvas/ui/canvas-ui.css";
	import * as Tooltip from "#src/shadcn/tooltip/index.js";

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
	// Roving focus remembers its tab stop by element, so a panel whose sections change is rebuilt fresh.
	let controlsKey = $derived(summary ? [...summary.controls].join() : "");
	let strokeLabel = $derived(
		summary?.controls.has("fill") || summary?.controls.has("width") ? labels.stroke : labels.colour,
	);

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
				? {
						left: Math.min(box.left, left),
						top: Math.min(box.top, top),
						right: Math.max(box.right, right),
						bottom: Math.max(box.bottom, bottom),
					}
				: { left, top, right, bottom };
		}
		return box;
	});

	// Beside the selection on the side with room, never over its grips. Null leaves the panel docked at the right edge.
	let placed = $derived(
		selection && barWidth > 0
			? placeBeside(
					selection,
					{ width: barWidth, height: barHeight },
					{ width: store.width, height: store.height },
				)
			: null,
	);

	// =========================
	// FUNCTIONS
	// =========================
	function change(next: Partial<StyleValues>) {
		const ops = styleOps(nodes, next, frameType);
		if (ops.length > 0) commit(ops);
	}

	// A single-select group sends "" when its pressed item is pressed again. A style stays set.
	// Each group's values are the item values written below, so a value maps back to its own type.
	function pick(key: keyof StyleValues, value: string) {
		if (!value) return;
		if (key === "fill") change({ fill: value as FillValue });
		else if (key === "stroke") change({ stroke: value as PenColor });
		else if (key === "width") change({ width: Number(value) as WidthLevel });
		else if (key === "fontSize") change({ fontSize: Number(value) });
		else change({ fontWeight: value as FontWeight });
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if summary}
	{@const { values, controls } = summary}
	<Panel
		position="center-right"
		class="cv-dock cv-style-dock {placed ? 'is-placed' : ''}"
		style={placed
			? `--cv-style-x:${Math.round(placed.x)}px;--cv-style-y:${Math.round(placed.y)}px`
			: undefined}
		data-side={placed?.side}
	>
		<Tooltip.Provider>
			{#key controlsKey}
				<Toolbar.Root aria-label={labels.panel}>
					{#snippet child({ props })}
						<div
							{...props}
							bind:offsetWidth={barWidth}
							bind:offsetHeight={barHeight}
							class="cv-bar cv-style t-enter"
							data-testid="style-panel"
						>
							{#if controls.has("fill")}
								<div
									class="cv-section"
									role="group"
									aria-label={labels.fill}
									data-testid="style-fill"
								>
									<span class="cv-label" aria-hidden="true">{labels.fill}</span>
									<Toolbar.Group
										type="single"
										class="cv-swatches"
										bind:value={() => values.fill, (value) => pick("fill", value)}
									>
										<BarTooltip label={labels.none} name="{labels.fill}: {labels.none}" side="left">
											{#snippet child({ props })}
												<Toolbar.GroupItem
													{...props}
													value="none"
													class="cv-swatch cv-swatch-none"
												/>
											{/snippet}
										</BarTooltip>
										{#each PEN_COLORS as swatch (swatch)}
											{@render colorItem(swatch, labels.fill)}
										{/each}
									</Toolbar.Group>
								</div>
							{/if}

							{#if controls.has("stroke")}
								<div
									class="cv-section"
									role="group"
									aria-label={strokeLabel}
									data-testid="style-stroke"
								>
									<span class="cv-label" aria-hidden="true">{strokeLabel}</span>
									<Toolbar.Group
										type="single"
										class="cv-swatches"
										bind:value={() => values.stroke, (value) => pick("stroke", value)}
									>
										{#each PEN_COLORS as swatch (swatch)}
											{@render colorItem(swatch, strokeLabel)}
										{/each}
									</Toolbar.Group>
								</div>
							{/if}

							{#if controls.has("width")}
								<div
									class="cv-section"
									role="group"
									aria-label={labels.width}
									data-testid="style-width"
								>
									<span class="cv-label" aria-hidden="true">{labels.width}</span>
									<Toolbar.Group
										type="single"
										class="cv-swatches"
										bind:value={() => String(values.width), (value) => pick("width", value)}
									>
										{#each LEVELS as level (level)}
											<BarTooltip
												label={labels.widths[level]}
												name="{labels.width}: {labels.widths[level]}"
												side="left"
											>
												{#snippet child({ props })}
													<Toolbar.GroupItem {...props} value={String(level)} class="cv-btn">
														<span class="cv-line" style:--line="{[1.5, 3, 5][level]}px"></span>
													</Toolbar.GroupItem>
												{/snippet}
											</BarTooltip>
										{/each}
									</Toolbar.Group>
								</div>
							{/if}

							{#if controls.has("fontSize")}
								<div
									class="cv-section"
									role="group"
									aria-label={labels.font}
									data-testid="style-font"
								>
									<span class="cv-label" aria-hidden="true">{labels.font}</span>
									<!-- Size and weight are two picks that share one grid, so each group lays out as its items. -->
									<div class="cv-swatches">
										<Toolbar.Group
											type="single"
											class="cv-contents"
											bind:value={() => String(values.fontSize), (value) => pick("fontSize", value)}
										>
											{#each FONT_SIZES as size (size)}
												<Toolbar.GroupItem
													value={String(size)}
													class="cv-btn cv-figure"
													aria-label="{labels.font}: {size}">{size}</Toolbar.GroupItem
												>
											{/each}
										</Toolbar.Group>
										<Toolbar.Group
											type="single"
											class="cv-contents"
											bind:value={() => values.fontWeight, (value) => pick("fontWeight", value)}
										>
											{#each WEIGHTS as weight (weight)}
												<BarTooltip
													label={weight === "bold" ? labels.bold : labels.regular}
													side="left"
												>
													{#snippet child({ props })}
														<Toolbar.GroupItem
															{...props}
															value={weight}
															class="cv-btn cv-figure"
															style="font-weight: {weight === 'bold' ? 700 : 400}"
															>Aa</Toolbar.GroupItem
														>
													{/snippet}
												</BarTooltip>
											{/each}
										</Toolbar.Group>
									</div>
								</div>
							{/if}
						</div>
					{/snippet}
				</Toolbar.Root>
			{/key}
		</Tooltip.Provider>
	</Panel>
{/if}

{#snippet colorItem(swatch: PenColor, section: string)}
	<BarTooltip label={labels.colors[swatch]} name="{section}: {labels.colors[swatch]}" side="left">
		{#snippet child({ props })}
			<Toolbar.GroupItem
				{...props}
				value={swatch}
				class="cv-swatch"
				style="--swatch: var(--pen-{swatch})"
			/>
		{/snippet}
	</BarTooltip>
{/snippet}

<style>
	@layer theme, base, components, utilities;

	@layer components {
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
			line-height: calc(16 / 12);
		}

		/* Bits renders the groups and their items, so those classes are reached through the bar. */
		.cv-style :global(.cv-swatches) {
			display: grid;
			grid-template-columns: repeat(3, var(--cv-btn));
			gap: 0;
		}

		.cv-style :global(.cv-contents) {
			display: contents;
		}

		.cv-line {
			width: 18px;
			height: var(--line);
			border-radius: 999px;
			background: currentColor;
		}

		.cv-style :global(.cv-figure) {
			font-size: 12px;
			font-variant-numeric: tabular-nums;
		}

		/* No fill is an empty disc struck through, since a swatch can't show the absence of a colour. */
		.cv-style :global(.cv-swatch-none)::before {
			background:
				linear-gradient(135deg, transparent 46%, var(--cv-ink-muted) 46% 54%, transparent 54%),
				var(--cv-surface);
		}
	}
</style>
