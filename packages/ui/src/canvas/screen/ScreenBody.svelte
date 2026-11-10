<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { RadioGroup } from "bits-ui";
	import { getDiagramEditorContext } from "#src/canvas/editor/editor-context.js";
	import { isLocked } from "#src/canvas/editor/lock.js";
	import { DEFAULT_SCREEN_LABELS, type ScreenLabels } from "#src/canvas/screen/labels.js";
	import {
		addPart,
		movePart,
		normalizeScreen,
		patchPart,
		removePart,
	} from "#src/canvas/screen/parts.js";
	import GlyphIcon from "#src/canvas/screen/GlyphIcon.svelte";
	import PartView from "#src/canvas/screen/PartView.svelte";
	import {
		PART_KINDS,
		SCREEN_MODES,
		type PartKind,
		type ScreenMode,
		type ScreenPart,
	} from "#src/canvas/screen/types.js";
	import "#src/canvas/screen/screen.css";

	// What sits in a Screen card's frame. Every edit patches the node's `data`, so undo and
	// save come from the editor and nothing here keeps a copy.

	// =========================
	// TYPES
	// =========================
	interface Props {
		id: string;
		data: Record<string, unknown>;
		/** The host's translations. Missing keys fall back to English. */
		labels?: Partial<ScreenLabels>;
	}

	// =========================
	// PROPS
	// =========================
	let { id, data, labels: given }: Props = $props();

	// =========================
	// STATE
	// =========================
	const editor = getDiagramEditorContext();
	let tray = $state(false);

	// =========================
	// DERIVED
	// =========================
	let screen = $derived(normalizeScreen(data));
	let labels = $derived<ScreenLabels>({
		...DEFAULT_SCREEN_LABELS,
		...given,
		modes: { ...DEFAULT_SCREEN_LABELS.modes, ...given?.modes },
		kinds: { ...DEFAULT_SCREEN_LABELS.kinds, ...given?.kinds },
	});
	let readonly = $derived(!editor || isLocked({ data }));
	let showTray = $derived(!readonly && (tray || screen.parts.length === 0));

	// =========================
	// FUNCTIONS
	// =========================
	function write(patch: Record<string, unknown>, live = false) {
		editor?.patchNodeData(id, patch, live ? { coalesce: true } : undefined);
	}

	function setMode(mode: ScreenMode) {
		if (mode !== screen.mode) write({ mode });
	}

	// Svelte Flow nudges a selected card on an arrow, so the mode switch keeps the keys it moves by.
	function keepArrows(event: KeyboardEvent) {
		if (event.key.startsWith("Arrow") || event.key === "Home" || event.key === "End") {
			event.stopPropagation();
		}
	}

	function add(kind: PartKind) {
		write({ parts: addPart(screen.parts, kind) });
		tray = false;
	}

	function commitPart(
		part: ScreenPart,
		change: Partial<Omit<ScreenPart, "id" | "kind">>,
		live: boolean,
	) {
		write({ parts: patchPart(screen.parts, part.id, change) }, live);
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class="cv-screen" data-mode={screen.mode} data-testid="screen-card">
	<div class="cv-title-bar">
		<input
			class="cv-field cv-name nodrag"
			value={screen.label}
			{readonly}
			placeholder={labels.name}
			aria-label={labels.name}
			oninput={(event) => write({ label: event.currentTarget.value }, true)}
			onblur={() => editor?.endTextEdit()}
			onkeydown={(event) => {
				event.stopPropagation();
				if (event.key === "Escape") event.currentTarget.blur();
			}}
		/>
		{#if !readonly}
			<RadioGroup.Root
				class="cv-switch nodrag"
				orientation="horizontal"
				aria-label={labels.mode}
				bind:value={() => screen.mode, (mode) => setMode(mode as ScreenMode)}
				onkeydown={keepArrows}
			>
				{#each SCREEN_MODES as mode (mode)}
					<RadioGroup.Item value={mode} class="cv-seg" data-mode-option={mode}>
						{labels.modes[mode]}
					</RadioGroup.Item>
				{/each}
			</RadioGroup.Root>
		{/if}
	</div>

	<div class="cv-stage">
		{#each screen.parts as part, index (part.id)}
			<PartView
				{part}
				mode={screen.mode}
				{index}
				count={screen.parts.length}
				{labels}
				{readonly}
				onCommit={(change, live) => commitPart(part, change, live)}
				onMove={(step) => write({ parts: movePart(screen.parts, part.id, step) })}
				onRemove={() => write({ parts: removePart(screen.parts, part.id) })}
				onEnd={() => editor?.endTextEdit()}
			/>
		{/each}

		{#if !readonly}
			{#if showTray}
				<div class="cv-tray nodrag" data-testid="screen-tray">
					{#each PART_KINDS as kind (kind)}
						<button type="button" class="cv-tile" data-add={kind} onclick={() => add(kind)}>
							<GlyphIcon name={kind} size={20} />
							<span>{labels.kinds[kind]}</span>
						</button>
					{/each}
				</div>
			{:else}
				<button
					type="button"
					class="cv-add nodrag"
					data-testid="screen-add"
					onclick={() => (tray = true)}
				>
					<GlyphIcon name="plus" />
					{labels.addPart}
				</button>
			{/if}
		{/if}
	</div>
</div>
