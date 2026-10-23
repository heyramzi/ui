<script lang="ts">
	import { tick } from "svelte";
	import { useApp } from "#src/hooks/app.svelte.js";
	import { createPicker } from "#src/hooks/picker.svelte.js";
	import Icon from "#src/components/icons/Icon.svelte";
	import Kbd from "#src/ui/Kbd.svelte";
	import RefMenu from "#src/ui/RefMenu.svelte";
	import TargetChip from "#src/ui/TargetChip.svelte";

	const app = useApp();
	const c = app.compose;
	const picker = createPicker(app.library);
	let area = $state<HTMLTextAreaElement>();

	const timed = $derived(
		!!app.review.model?.player && (c.target.kind === "time" || c.target.kind === "video"),
	);
	const time = $derived(c.time);
	const general = $derived(c.target.kind === "video");
	const canSpan = $derived(!!time && (!!time.span || app.player.time > time.at + 0.05));
	const placeholder = $derived(
		general && timed
			? "What should change across the whole video?"
			: time?.span
				? "What should change in this section?"
				: time?.frame
					? "What's wrong in this part of the frame?"
					: time
						? "What's wrong with this moment?"
						: "What should change here?",
	);

	/** Types the @ for them, so the picker opens without knowing the shortcut. */
	function mention() {
		if (!area) return;
		const at = area.selectionStart ?? area.value.length;
		const before = area.value.slice(0, at);
		const pad = before && !/\s$/.test(before) ? " " : "";
		area.setRangeText(`${pad}@`, at, area.selectionEnd ?? at, "end");
		area.focus();
		area.dispatchEvent(new Event("input", { bubbles: true }));
	}

	function open() {
		const sel = app.selection.target;
		const now = Math.round(app.player.time * 10) / 10;
		c.start(sel ?? (c.target.kind === "time" ? { kind: "time", at: now } : undefined));
		if (c.target.kind === "time") app.player.pause();
		if (sel) app.selection.clear();
		app.panels.showPanel();
	}
	function submit() {
		const action = c.take();
		if (!action) return;
		app.pinning = false;
		app.review.act(action);
		app.stage = "agents";
	}
	function cancel() {
		app.pinning = false;
		c.cancel();
	}
	function frame() {
		if (time?.frame) c.setFrame(null);
		else {
			app.player.pause();
			app.pinning = !app.pinning;
		}
	}

	$effect(() => {
		void c.focusTick;
		if (c.open) void tick().then(() => area?.focus());
	});

	$effect(() => {
		const offs = [
			app.keys.bind({
				id: "note.compose",
				keys: ["c"],
				label: "Note",
				group: "Notes",
				run: open,
			}),
			app.keys.bind({
				id: "note.general",
				keys: ["g"],
				label: "Note on the whole video",
				group: "Notes",
				enabled: () => !!app.review.model?.player,
				run: () => {
					c.toggleGeneral();
					app.panels.showPanel();
				},
			}),
			app.keys.bind({
				id: "note.cancel",
				keys: ["escape"],
				label: "Close the box",
				group: "Notes",
				inInput: true,
				enabled: () => c.open,
				run: cancel,
			}),
		];
		return () => offs.forEach((off) => off());
	});

	function onkey(event: KeyboardEvent) {
		if (picker.keydown(event)) return;
		if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
			event.preventDefault();
			submit();
		}
	}
</script>

<div class="compose" class:open={c.open}>
	{#if !c.open}
		<button class="opener" onclick={open}><Icon name="note" />Note<Kbd combo="c" /></button>
	{:else}
		<div class="box">
			<div class="meta">
				<TargetChip target={c.target} onclear={c.pinned ? () => c.pin(null) : undefined} />
				<button class="btn icon close" aria-label="Close" data-tip="Close (Esc)" onclick={cancel}
					><Icon name="x" small /></button
				>
			</div>
			<div class="field">
				<textarea
					bind:this={area}
					bind:value={c.text}
					rows="3"
					aria-label="Note"
					{placeholder}
					{...picker.attrs}
					oninput={(e) => picker.sync(e.currentTarget)}
					onclick={(e) => picker.sync(e.currentTarget)}
					onkeyup={(e) =>
						/^(Arrow(Left|Right)|Home|End)$/.test(e.key) && picker.sync(e.currentTarget)}
					onblur={() => picker.close()}
					onkeydown={onkey}></textarea>
				<RefMenu {picker} />
			</div>
			<div class="row">
				{#if timed}
					<div class="scope" role="group" aria-label="What the note covers">
						{#if time}
							<button
								class="btn tog"
								aria-pressed={!!time.span}
								disabled={!canSpan}
								data-tip={time.span ? "Back to one moment" : "Stretch to the playhead"}
								onclick={() => c.setSpan(time.span ? null : app.player.time)}
								><Icon name="span" small />Stretch</button
							>
							<button
								class="btn tog"
								aria-pressed={!!time.frame || app.pinning}
								data-tip={time.frame ? "Drop the spot" : "Click or drag on the video"}
								onclick={frame}><Icon name="frame" small />Spot</button
							>
						{/if}
						<button
							class="btn tog"
							aria-pressed={general}
							data-tip="Whole video, no time"
							onclick={() => c.toggleGeneral()}
							><Icon name="video" small />Whole video<Kbd combo="g" /></button
						>
					</div>
				{/if}
				<span class="spacer"></span>
				{#if app.library.shelves.length}
					<!-- WHY: mousedown is held so the field keeps focus and the picker stays open. -->
					<button
						class="btn"
						onmousedown={(e) => e.preventDefault()}
						onclick={mention}
						data-tip="Mention a {app.library.shelves
							.map((s) => s.label.toLowerCase())
							.join(', ')} item"><Icon name="plus" small />Mention<Kbd combo="@" /></button
					>
				{/if}
				<button class="btn primary" disabled={!c.text.trim()} onclick={submit}
					>Add note<Kbd combo="enter" /></button
				>
			</div>
		</div>
	{/if}
</div>

<style>
	.compose {
		flex: none;
		padding: 10px 12px 12px;
		border-top: 1px solid var(--line-soft);
	}
	.opener {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		min-height: 40px;
		padding: 0 12px;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--ground);
		color: var(--dim);
		transition:
			border-color var(--duration-quick) var(--ease-smooth-out),
			color var(--duration-quick) var(--ease-smooth-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.opener:hover {
			border-color: var(--accent-line);
			color: var(--text);
		}
	}
	.opener :global(kbd) {
		margin-left: auto;
	}
	.box {
		display: grid;
		min-width: 0;
		gap: 6px;
		padding: 10px;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--surface);
		box-shadow: var(--shadow-lift);
		animation: rv-swap var(--duration-fast) var(--ease-in-out) both;
		transition:
			border-color var(--duration-quick) var(--ease-smooth-out),
			box-shadow var(--duration-quick) var(--ease-smooth-out);
	}
	/* The box shows focus as a soft ring, so the field inside needs no square outline of its own. */
	.box:focus-within {
		border-color: var(--accent-line);
		box-shadow:
			0 0 0 3px var(--accent-soft),
			var(--shadow-lift);
	}
	.field textarea:focus-visible {
		outline: none;
	}
	.meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 6px;
		min-width: 0;
	}
	.close {
		flex: none;
		width: 24px;
		min-height: 24px;
		margin: -2px -2px 0 0;
	}
	.field {
		position: relative;
	}
	textarea {
		width: 100%;
		min-height: 64px;
		padding: 4px;
		border: 0;
		outline: 0;
		resize: none;
		background: transparent;
		line-height: 1.5;
	}
	textarea::placeholder {
		color: var(--faint);
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}
	.scope {
		display: flex;
		gap: 2px;
		padding: 2px;
		border-radius: var(--radius-sm);
		background: var(--surface);
	}
	.tog {
		gap: 5px;
		min-height: 26px;
		padding: 0 7px;
	}
	.tog[aria-pressed="true"] {
		background: var(--accent-soft);
		color: var(--text);
		box-shadow: inset 0 0 0 1px var(--accent-line);
	}
	.spacer {
		flex: 1;
	}
	.row .primary {
		margin-left: auto;
	}
	.row :global(kbd) {
		background: transparent;
		color: inherit;
		opacity: 0.75;
	}
	/* The box sits at the panel's foot, so its tips open upward. */
	.row [data-tip]::after {
		top: auto;
		bottom: calc(100% + 8px);
		transform-origin: bottom center;
	}
</style>
