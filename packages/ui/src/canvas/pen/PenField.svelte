<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { useTextField, type TextFieldHandle } from "#src/canvas/editor/text-field-context.js";
	import { useHandDrawn } from "#src/canvas/editor/hand-context.js";
	import "#src/canvas/pen/pen.css";

	// The words of a pen text or a shape label: the host's field when it gave one (formatted text,
	// its own bar and undo), else a plain textarea.

	// =========================
	// TYPES
	// =========================
	interface Props {
		value: string;
		/** Which pen element it sits in. Sets the size and the box it keeps. */
		variant: "text" | "label";
		onCommit: (next: string, live: boolean) => void;
		ariaLabel: string;
		/** Typing needs the canvas editor; without one the words are shown, not changed. */
		readonly?: boolean;
		selected?: boolean;
		color?: string;
		fontSize?: number;
		fontWeight?: number;
		center?: boolean;
		column?: boolean;
		/** Called when the field closes. */
		onExit?: () => void;
	}

	// =========================
	// PROPS
	// =========================
	let {
		value,
		variant,
		onCommit,
		ariaLabel,
		readonly = false,
		selected = false,
		color,
		fontSize,
		fontWeight,
		center = false,
		column = false,
		onExit,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	const Field = useTextField();
	const handDrawn = useHandDrawn();
	let textarea = $state<HTMLTextAreaElement>();
	let field = $state<TextFieldHandle>();
	let editing = $state(false);

	// =========================
	// DERIVED
	// =========================
	let style = $derived(
		[
			color && `color: ${color}`,
			fontSize && `font-size: ${fontSize}px`,
			fontWeight && `font-weight: ${fontWeight}`,
			center && "text-align: center",
		]
			.filter(Boolean)
			.join("; "),
	);

	// =========================
	// FUNCTIONS
	// =========================
	/** Open the field for typing. A host field opens where `point` landed, else at the end. */
	export function edit(point?: { x: number; y: number }) {
		if (readonly) return;
		if (field) return field.edit(point);
		textarea?.focus();
	}

	function close() {
		editing = false;
		onExit?.();
	}

	// A text you aren't typing in drags like any card, so a first press must not focus it.
	function press(event: MouseEvent) {
		if (variant === "text" && !editing) event.preventDefault();
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if Field}
	<Field
		bind:this={field}
		{value}
		{onCommit}
		{ariaLabel}
		{readonly}
		{style}
		class="pen-field is-{variant} is-rich {handDrawn() ? 'hand' : ''} {selected
			? 'selected'
			: ''} {column ? 'column' : ''}"
		clickToEdit={variant === "label"}
		onExit={close}
	/>
{:else}
	<textarea
		bind:this={textarea}
		class="pen-field is-{variant}"
		class:selected
		class:hand={handDrawn()}
		class:column
		class:nodrag={variant === "label" || editing}
		rows="1"
		{value}
		{style}
		{readonly}
		aria-label={ariaLabel}
		oninput={(event) => onCommit(event.currentTarget.value, true)}
		onfocus={() => (editing = true)}
		onmousedown={press}
		onblur={close}
		onkeydown={(event) => {
			// Typing must never reach the canvas shortcuts, where Delete would remove the node.
			event.stopPropagation();
			if (event.key === "Escape") event.currentTarget.blur();
		}}></textarea>
{/if}
