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
	import { mergeProps, Toolbar } from "bits-ui";
	import type { Snippet } from "svelte";
	import "#src/canvas/pen/pen.css";
	import { PEN_COLORS } from "#src/canvas/pen/types.js";
	import "#src/canvas/ui/canvas-ui.css";
	import ToolIcon from "#src/canvas/components/icons/ToolIcon.svelte";
	import BarTooltip from "#src/canvas/ui/BarTooltip.svelte";
	import * as Tooltip from "#src/shadcn/tooltip/index.js";
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
	let styleBar = $state<HTMLElement | null>(null);
	/** The value of the style bar item that had focus when its layout changed, or null when focus was elsewhere. */
	let refocus: string | null = null;

	// =========================
	// DERIVED
	// =========================
	const BRUSHES = ["pen", "highlighter", "eraser"] as const;
	const SHAPES = ["rectangle", "ellipse", "diamond"] as const;
	const BRUSH_DOT = [4, 7, 11] as const;
	const SINGLE_TOOLS = ["select", "hand", "connect"] as const;

	let shapeActive = $derived(isShapeTool(tool));
	let brushActive = $derived(isBrushTool(tool));
	let showStyle = $derived(brushActive || shapeActive || hasColor(tool));
	/** The brush and shape buttons stand for a family of tools, so the rail's pick is the family. */
	let railValue = $derived(brushActive ? "brush" : shapeActive ? "shapes" : tool);
	// Roving focus remembers its tab stop by element, so a bar whose items change is rebuilt fresh.
	let styleLayout = $derived(
		`${brushActive ? "brush" : shapeActive ? "shape" : "none"}-${hasColor(tool)}-${hasBrush(tool)}`,
	);

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		if (isShapeTool(tool)) lastShape = tool;
		if (isBrushTool(tool)) lastBrush = tool;
	});

	$effect.pre(() => {
		void styleLayout;
		const active = document.activeElement;
		refocus =
			active instanceof HTMLElement && styleBar?.contains(active)
				? (active.dataset.value ?? "")
				: null;
	});

	$effect(() => {
		void styleLayout;
		if (refocus === null || !styleBar) return;
		const items = [...styleBar.querySelectorAll<HTMLElement>("[data-toolbar-item]")];
		(items.find((item) => item.dataset.value === refocus) ?? items[0])?.focus();
		refocus = null;
	});

	// =========================
	// FUNCTIONS
	// =========================
	// A single-select group sends "" when its pressed item is pressed again. A tool stays picked.
	function pickRail(value: string) {
		if (value === "brush") tool = lastBrush;
		else if (value === "shapes") tool = lastShape;
		else if (value) tool = value as CanvasTool;
	}

	// Svelte Flow deselects a node on Esc and blurs it a frame later, so focus fell to the page
	// and the tool letters stopped. A later frame hands focus back to the node. The listener sits
	// on the window: Svelte runs the node's own handler at its root, so a frame asked for any
	// lower would run before the blur.
	function keepNodeFocus(panel: HTMLElement) {
		const flow = panel.closest<HTMLElement>(".svelte-flow");
		if (!flow) return;
		const onkeydown = (event: KeyboardEvent) => {
			const node = event.target;
			if (event.key !== "Escape" || !(node instanceof HTMLElement)) return;
			if (!node.matches(".svelte-flow__node") || !flow.contains(node)) return;
			requestAnimationFrame(() => node.isConnected && node.focus());
		};
		window.addEventListener("keydown", onkeydown);
		return () => window.removeEventListener("keydown", onkeydown);
	}

	function pickTool(value: string) {
		if (value) tool = value as CanvasTool;
	}

	function pickColor(value: string) {
		if (value) color = value as PenColor;
	}

	function pickLevel(value: string) {
		if (value) level = Number(value) as BrushLevel;
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<Panel position="center-left" class="cv-dock" {@attach keepNodeFocus}>
	<Tooltip.Provider>
		<div class="cv-row">
			<Toolbar.Root
				class="cv-bar cv-rail"
				orientation="vertical"
				aria-orientation="vertical"
				aria-label={labels.toolbar}
			>
				<Toolbar.Group type="single" class="cv-group" bind:value={() => railValue, pickRail}>
					{#each SINGLE_TOOLS as id (id)}
						{@render railItem(id, labels.tools[id], keyForTool(id), id)}
					{/each}
					{@render railItem(
						"brush",
						labels.tools[lastBrush],
						keyForTool(lastBrush),
						brushActive ? (tool as BrushTool) : lastBrush,
					)}
					{@render railItem("text", labels.tools.text, keyForTool("text"), "text")}
					{@render railItem(
						"shapes",
						labels.tools.shapes,
						keyForTool("rectangle"),
						shapeActive ? (tool as typeof lastShape) : lastShape,
					)}
					{@render railItem("frame", labels.tools.frame, keyForTool("frame"), "frame")}
				</Toolbar.Group>
				{#if onNote}
					<BarTooltip label={labels.tools.note} shortcut="N" side="right">
						{#snippet child({ props })}
							<Toolbar.Button {...mergeProps(props, { onclick: onNote })} class="cv-btn">
								<ToolIcon name="note" />
							</Toolbar.Button>
						{/snippet}
					</BarTooltip>
				{/if}

				{#if extra}
					<span class="cv-gap" aria-hidden="true"></span>
					{@render extra()}
				{/if}
			</Toolbar.Root>

			{#if showStyle}
				<div class="cv-bar t-enter" bind:this={styleBar}>
					{#key styleLayout}
						<Toolbar.Root class="cv-group" aria-label={labels.style}>
							{#if brushActive || shapeActive}
								<Toolbar.Group type="single" class="cv-group" bind:value={() => tool, pickTool}>
									{#each brushActive ? BRUSHES : SHAPES as kind (kind)}
										<BarTooltip label={labels.tools[kind]} shortcut={keyForTool(kind)}>
											{#snippet child({ props })}
												<Toolbar.GroupItem {...props} value={kind} class="cv-btn">
													<ToolIcon name={kind} />
												</Toolbar.GroupItem>
											{/snippet}
										</BarTooltip>
									{/each}
								</Toolbar.Group>
							{/if}

							{#if hasColor(tool)}
								{#if brushActive || shapeActive}<span class="cv-gap" aria-hidden="true"></span>{/if}
								<Toolbar.Group type="single" class="cv-group" bind:value={() => color, pickColor}>
									{#each PEN_COLORS as swatch (swatch)}
										<BarTooltip label={labels.colors[swatch]}>
											{#snippet child({ props })}
												<Toolbar.GroupItem
													{...props}
													value={swatch}
													class="cv-swatch"
													style="--swatch: var(--pen-{swatch})"
												/>
											{/snippet}
										</BarTooltip>
									{/each}
								</Toolbar.Group>
							{/if}

							{#if hasBrush(tool)}
								<span class="cv-gap" aria-hidden="true"></span>
								<Toolbar.Group
									type="single"
									class="cv-group"
									bind:value={() => String(level), pickLevel}
								>
									{#each BRUSH_DOT as dot, index (index)}
										<BarTooltip label={labels.sizes[index]}>
											{#snippet child({ props })}
												<Toolbar.GroupItem {...props} value={String(index)} class="cv-btn">
													<span class="cv-dot" style:--dot="{dot}px"></span>
												</Toolbar.GroupItem>
											{/snippet}
										</BarTooltip>
									{/each}
								</Toolbar.Group>
							{/if}
						</Toolbar.Root>
					{/key}
				</div>
			{/if}
		</div>
	</Tooltip.Provider>
</Panel>

{#snippet railItem(value: string, label: string, shortcut: string, icon: CanvasTool)}
	<BarTooltip {label} {shortcut} side="right">
		{#snippet child({ props })}
			<Toolbar.GroupItem {...props} {value} class="cv-btn">
				<ToolIcon name={icon} />
			</Toolbar.GroupItem>
		{/snippet}
	</BarTooltip>
{/snippet}
