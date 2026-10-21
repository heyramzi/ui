<script lang="ts">
// =========================
// IMPORTS
// =========================
import { tick } from "svelte";
import GlyphIcon from "#src/canvas/screen/GlyphIcon.svelte";
import { addItem, removeItem, setItem } from "#src/canvas/screen/parts.js";
import type { ScreenLabels } from "#src/canvas/screen/labels.js";
import type { ScreenMode, ScreenPart } from "#src/canvas/screen/types.js";

// One kit part, drawn as grey boxes or in the board's tokens. Its words are inputs in both.

// =========================
// TYPES
// =========================
interface Props {
	part: ScreenPart;
	mode: ScreenMode;
	index: number;
	count: number;
	labels: ScreenLabels;
	readonly?: boolean;
	oncommit: (patch: Partial<Omit<ScreenPart, "id" | "kind">>, live: boolean) => void;
	onmove: (step: -1 | 1) => void;
	onremove: () => void;
	onend: () => void;
}

// =========================
// PROPS
// =========================
let { part, mode, index, count, labels, readonly = false, oncommit, onmove, onremove, onend }: Props = $props();

// =========================
// STATE
// =========================
let root = $state<HTMLElement>();

// =========================
// DERIVED
// =========================
let items = $derived(part.items ?? []);

// =========================
// FUNCTIONS
// =========================
function keep(event: KeyboardEvent) {
	// A key typed into a part's words is the part's, so it never reaches the board's shortcuts.
	event.stopPropagation();
	if (event.key === "Escape") (event.currentTarget as HTMLElement).blur();
}

async function focusItem(at: number) {
	await tick();
	root?.querySelector<HTMLInputElement>(`[data-item="${at}"]`)?.focus();
}

function itemKey(event: KeyboardEvent, at: number) {
	keep(event);
	if (event.key === "Enter") {
		event.preventDefault();
		oncommit({ items: [...items.slice(0, at + 1), "Item", ...items.slice(at + 1)] }, false);
		focusItem(at + 1);
	} else if (event.key === "Backspace" && items[at] === "" && items.length > 1) {
		event.preventDefault();
		oncommit({ items: removeItem(items, at) }, false);
		focusItem(Math.max(0, at - 1));
	}
}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#snippet words(value: string, aria: string, commit: (next: string, live: boolean) => void, cls = "")}
	<input
		class="cv-field nodrag {cls}"
		{value}
		{readonly}
		aria-label={aria}
		oninput={(event) => commit(event.currentTarget.value, true)}
		onblur={onend}
		onkeydown={keep}
	/>
{/snippet}

<div bind:this={root} class="cv-part is-{part.kind}" data-part={part.kind} data-part-id={part.id}>
	{#if part.kind === "header"}
		<div class="cv-header">
			<span class="cv-brand" aria-hidden="true"></span>
			{@render words(part.label, labels.kinds.header, (next, live) => oncommit({ label: next }, live), "cv-header-title")}
			<span class="cv-menu" aria-hidden="true"><i></i><i></i><i></i></span>
		</div>
	{:else if part.kind === "button"}
		<div class="cv-button-row">
			<div class="cv-button is-{part.variant ?? 'primary'}">
				{@render words(part.label, labels.kinds.button, (next, live) => oncommit({ label: next }, live))}
			</div>
		</div>
	{:else if part.kind === "input"}
		<div class="cv-input">
			{@render words(part.label, labels.kinds.input, (next, live) => oncommit({ label: next }, live), "cv-input-label")}
			<div class="cv-input-box" aria-hidden="true"><i></i></div>
		</div>
	{:else if part.kind === "image"}
		<div class="cv-image">
			<div class="cv-image-box" aria-hidden="true">
				<GlyphIcon name="hills" size={60} class="cv-hills" />
			</div>
			{@render words(part.label, labels.kinds.image, (next, live) => oncommit({ label: next }, live), "cv-caption")}
		</div>
	{:else if part.kind === "list"}
		<ul class="cv-list">
			{#each items as item, at (at)}
				<li class="cv-list-row">
					<i aria-hidden="true"></i>
					<input
						class="cv-field nodrag"
						data-item={at}
						value={item}
						{readonly}
						aria-label={labels.kinds.list}
						oninput={(event) => oncommit({ items: setItem(items, at, event.currentTarget.value) }, true)}
						onblur={onend}
						onkeydown={(event) => itemKey(event, at)}
					/>
					{#if !readonly && items.length > 1}
						<button type="button" class="cv-mini nodrag" aria-label={labels.removeItem} onclick={() => oncommit({ items: removeItem(items, at) }, false)}>
							<GlyphIcon name="close" size={10} />
						</button>
					{/if}
				</li>
			{/each}
			{#if !readonly}
				<li class="cv-list-row is-add">
					<button type="button" class="cv-add-item nodrag" onclick={() => oncommit({ items: addItem(items) }, false)}>
						<GlyphIcon name="plus" size={10} />
						{labels.addItem}
					</button>
				</li>
			{/if}
		</ul>
	{:else}
		<div class="cv-modal">
			<div class="cv-modal-head">
				{@render words(part.label, labels.kinds.modal, (next, live) => oncommit({ label: next }, live), "cv-modal-title")}
				<GlyphIcon name="close" size={10} class="cv-x" />
			</div>
			{@render words(part.text ?? "", labels.kinds.modal, (next, live) => oncommit({ text: next }, live), "cv-modal-text")}
		</div>
	{/if}

	{#if !readonly}
		<div class="cv-tools nodrag">
			{#if part.kind === "button"}
				<button
					type="button"
					class="cv-tool is-text"
					aria-pressed={part.variant !== "secondary"}
					onclick={() => oncommit({ variant: part.variant === "secondary" ? "primary" : "secondary" }, false)}
				>
					{part.variant === "secondary" ? labels.secondary : labels.primary}
				</button>
			{/if}
			<button type="button" class="cv-tool" aria-label={labels.moveUp} disabled={index === 0} onclick={() => onmove(-1)}>
				<GlyphIcon name="up" />
			</button>
			<button type="button" class="cv-tool" aria-label={labels.moveDown} disabled={index === count - 1} onclick={() => onmove(1)}>
				<GlyphIcon name="down" />
			</button>
			<button type="button" class="cv-tool" aria-label={labels.remove} onclick={onremove}>
				<GlyphIcon name="close" />
			</button>
		</div>
	{/if}
</div>
