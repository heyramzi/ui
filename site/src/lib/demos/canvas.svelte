<script lang="ts">
	import { Background, SvelteFlow, type Edge, type Node } from "@xyflow/svelte";
	import "@xyflow/svelte/dist/style.css";
	import { createCanvasDispatcher, createRegistry } from "@heyramzi/ui/canvas";
	import { buildShapeNode, buildTextNode, type PenColor } from "@heyramzi/ui/canvas/pen/index.js";
	import { penUiPlugin } from "@heyramzi/ui/canvas/pen/ui.js";
	import {
		brushSize,
		DEFAULT_BRUSH_LEVEL,
		isDrawingTool,
		type CanvasTool,
	} from "@heyramzi/ui/canvas/ui/tools.js";
	import CanvasToolbar from "@heyramzi/ui/canvas/ui/CanvasToolbar.svelte";
	import PenLayer from "@heyramzi/ui/canvas/ui/PenLayer.svelte";

	const registry = createRegistry([penUiPlugin]);

	// A board that opens with something on it, so the preview isn't an empty grid.
	let nodes = $state.raw<Node[]>([
		buildTextNode({ x: 40, y: 0 }, { id: "title", text: "Draw on me", fontSize: 28 }),
		buildShapeNode(
			"rectangle",
			{ x: 0, y: 70, width: 160, height: 90 },
			{ id: "idea", label: "Idea", color: "blue", filled: true },
		),
		buildShapeNode(
			"ellipse",
			{ x: 240, y: 70, width: 160, height: 90 },
			{ id: "ship", label: "Ship", color: "green", filled: true },
		),
	] as Node[]);
	let edges = $state.raw<Edge[]>([{ id: "idea-ship", source: "idea", target: "ship" }]);
	let tool = $state<CanvasTool>("select");
	let color = $state<PenColor>("ink");
	let level = $state(DEFAULT_BRUSH_LEVEL);

	const history = createCanvasDispatcher({
		getState: () => ({ nodes, edges }),
		setState: (next) => {
			nodes = next.nodes;
			edges = next.edges;
		},
		onMutated: () => {},
		opDefinitions: [...registry.ops.values()],
	});

	const labels = {
		toolbar: "Canvas tools",
		style: "Style",
		tools: {
			select: "Select",
			hand: "Hand",
			connect: "Connect",
			frame: "Frame",
			pen: "Pen",
			highlighter: "Highlighter",
			eraser: "Eraser",
			text: "Text",
			rectangle: "Rectangle",
			ellipse: "Ellipse",
			diamond: "Diamond",
			shapes: "Shapes",
			note: "Note",
		},
		colors: {
			ink: "Ink",
			red: "Red",
			blue: "Blue",
			green: "Green",
			amber: "Amber",
			violet: "Violet",
			indigo: "Indigo",
			terra: "Terracotta",
		},
		sizes: ["Small", "Medium", "Large"],
	} as const;
</script>

<div class="h-[440px] w-full overflow-hidden rounded-xl border border-border">
	<SvelteFlow bind:nodes bind:edges nodeTypes={registry.nodeTypes()} fitView>
		<Background />
		{#if isDrawingTool(tool)}
			<PenLayer
				{tool}
				{color}
				size={brushSize(tool, level)}
				{nodes}
				commit={(ops) => history.dispatch(ops)}
				startGesture={() => {
					history.begin();
					return history.commit;
				}}
			/>
		{/if}
		<CanvasToolbar bind:tool bind:color bind:level {labels} />
	</SvelteFlow>
</div>
