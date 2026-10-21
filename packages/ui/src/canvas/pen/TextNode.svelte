<script lang="ts">
// =========================
// IMPORTS
// =========================
import { Handle, Position, type NodeProps } from "@xyflow/svelte";
import { onMount } from "svelte";
import TextRule from "#src/canvas/components/shared/svg/TextRule.svelte";
import PenField from "#src/canvas/pen/PenField.svelte";
import { getDiagramEditorContext } from "#src/canvas/editor/editor-context.js";
import { useHandDrawn } from "#src/canvas/editor/hand-context.js";
import { isLocked } from "#src/canvas/editor/lock.js";
import { roughUnderline, seedFrom, sketchColors } from "#src/canvas/headless/sketch.js";
import "#src/canvas/pen/pen.css";
import { penColorVar } from "#src/canvas/pen/colors.js";
import type { TextData } from "#src/canvas/pen/types.js";

// =========================
// PROPS
// =========================
let { id, data, selected }: NodeProps = $props();

// =========================
// STATE
// =========================
const editor = getDiagramEditorContext();
const handDrawn = useHandDrawn();
let field = $state<ReturnType<typeof PenField>>();
let boxWidth = $state(0);

// =========================
// DERIVED
// =========================
let text = $derived(data as TextData);
let ink = $derived(penColorVar(text.color));
let rule = $derived(
	text.underline && boxWidth > 2
		? roughUnderline(
				boxWidth,
				{ seed: seedFrom(id) + 7, colors: { ...sketchColors("ink", false), stroke: ink } },
				{ formal: !handDrawn() },
			)
		: [],
);

// =========================
// EFFECTS
// =========================
// The editor asks a freshly dropped text to open, so the first thing typed lands in it.
onMount(() => editor?.registerStartEdit(id, () => void field?.edit()));

// =========================
// FUNCTIONS
// =========================
function onExit() {
	editor?.endTextEdit();
	// A click that typed nothing leaves no empty node behind.
	if (editor && text.text.trim() === "") editor.removeNode(id);
}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<Handle type="target" position={Position.Top} class="pen-handle" />
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="pen-text-box"
	class:column={text.fixedWidth}
	bind:clientWidth={boxWidth}
	ondblclick={(event) => field?.edit({ x: event.clientX, y: event.clientY })}
>
	<PenField
		bind:this={field}
		variant="text"
		value={text.text}
		readonly={!editor || isLocked({ data })}
		ariaLabel="Text"
		{selected}
		color={ink}
		fontSize={text.fontSize}
		fontWeight={text.fontWeight === "bold" ? 700 : undefined}
		center={text.align === "center"}
		column={text.fixedWidth}
		onCommit={(next, live) => editor?.patchNodeData(id, { text: next }, live ? { coalesce: true } : undefined)}
		{onExit}
	/>
	{#if rule.length > 0}
		<TextRule {rule} {ink} width={boxWidth} />
	{/if}
</div>
<Handle type="source" position={Position.Bottom} class="pen-handle" />

<style>
	.pen-text-box.column {
		width: 100%;
	}
</style>
