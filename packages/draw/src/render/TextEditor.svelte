<!-- The in-place text editor, in screen space so text tracks zoom, which hands its result to finishEditing: text is written, or the shape dropped if blank. -->
<script lang="ts">
	import { finishEditing, type Editor } from "../core";
	import { screenRect } from "./overlay";
	import { trackEditor } from "../runes/useEditor.svelte";

	let { editor, id }: { editor: Editor; id: string } = $props();

	const tracker = trackEditor(editor);

	const shape = $derived.by(() => {
		tracker.version;
		return editor.getShape(id);
	});
	const camera = $derived.by(() => {
		tracker.version;
		return editor.getCamera();
	});
	const box = $derived(
		shape ? screenRect({ x: shape.x, y: shape.y, w: shape.w, h: shape.h }, camera) : null,
	);
	const fontPx = $derived(shape ? fontSizeOf(shape.props) * camera.zoom : 16);
	const degrees = $derived(shape ? (shape.rotation * 180) / Math.PI : 0);

	let value = $state("");
	let el: HTMLTextAreaElement | undefined = $state();
	let lastId: string | null = null;
	let done = false;

	function fontSizeOf(props: Record<string, unknown>): number {
		const size = props.fontSize;
		return typeof size === "number" ? size : 20;
	}

	function readText(): string {
		const current = editor.getShape(id);
		const text = current?.props?.text;
		if (typeof text === "string") return text;
		// A frame carries its label in `name`.
		const name = (current?.props as { name?: unknown } | undefined)?.name;
		return typeof name === "string" ? name : "";
	}

	function commit(): void {
		if (done) return;
		done = true;
		finishEditing(editor, id, value);
	}

	// Load the shape's text once per editing id, then put the caret in.
	$effect(() => {
		if (id === lastId) return;
		lastId = id;
		done = false;
		value = readText();
		queueMicrotask(() => {
			el?.focus();
			el?.select();
		});
	});

	function onKeyDown(event: KeyboardEvent): void {
		// Enter commits; shift-enter keeps a newline. Escape keeps the text, as tldraw does.
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			commit();
		} else if (event.key === "Escape") {
			event.preventDefault();
			commit();
		}
	}
</script>

{#if box}
	<textarea
		bind:this={el}
		bind:value
		class="draw-text-editor"
		spellcheck="false"
		style:left="{box.x}px"
		style:top="{box.y}px"
		style:width="{box.w}px"
		style:height="{box.h}px"
		style:font-size="{fontPx}px"
		style:transform="rotate({degrees}deg)"
		onkeydown={onKeyDown}
		onblur={commit}
	></textarea>
{/if}

<style>
	.draw-text-editor {
		position: absolute;
		z-index: 2;
		margin: 0;
		padding: 0;
		border: 1px solid var(--draw-accent, #2f6feb);
		border-radius: 2px;
		background: color-mix(in srgb, var(--draw-bg, #fff) 92%, transparent);
		color: var(--draw-fg, #1e1e1e);
		font-family: sans-serif;
		line-height: 1.25;
		resize: none;
		overflow: hidden;
		transform-origin: center;
		outline: none;
		white-space: pre-wrap;
	}
</style>
