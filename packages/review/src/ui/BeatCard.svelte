<script lang="ts">
	import { isOpenBeat, kindOf, pickedOption, stateOf } from "#src/core/beats.js";
	import type { Beat, BeatState } from "#src/core/types.js";
	import { useApp } from "#src/hooks/app.svelte.js";
	import Icon from "#src/components/icons/Icon.svelte";
	import Kbd from "#src/ui/Kbd.svelte";
	import Preview from "#src/ui/Preview.svelte";
	import Swap from "#src/ui/Swap.svelte";

	let {
		beat,
		compact = false,
		autoplay = false,
		hideState,
		afterDecide,
	}: {
		beat: Beat;
		compact?: boolean;
		autoplay?: boolean;
		/** The state the list is already filtered to, so the chip isn't repeated on every row. */
		hideState?: BeatState;
		afterDecide?: (beat: Beat) => void;
	} = $props();

	const app = useApp();
	const model = $derived(app.review.model);
	const kind = $derived(model ? kindOf(model, beat.kind) : undefined);
	const option = $derived(pickedOption(beat));
	// WHY: a layout swap re-cuts the edit and signals the agent, so a chip only stages it. Confirm saves it.
	const confirms = $derived(beat.kind === "layout");
	let staged = $state<string>();
	const stagedOption = $derived(
		staged && staged !== option?.id ? beat.options.find((o) => o.id === staged) : undefined,
	);
	const shownOption = $derived(stagedOption ?? option);
	const shown = $derived(stateOf(beat));
	const current = $derived(app.beatId === beat.id);
	const noted = $derived(
		(model?.notes ?? []).filter(
			(note) =>
				note.target.kind === "beat" &&
				note.target.beat === beat.id &&
				note.status !== "done" &&
				note.status !== "dismissed",
		).length,
	);

	const STATE_LABEL: Record<BeatState, string> = {
		proposed: "To do",
		changed: "Changed",
		approved: "Kept",
		skipped: "Skipped",
	};

	function decide(state: BeatState, pick = option?.id) {
		app.review.act({ type: "decide", beat: beat.id, state, ...(pick ? { pick } : {}) });
		if (state === "approved" || state === "skipped") afterDecide?.(beat);
	}

	function choose(id: string) {
		if (confirms) {
			staged = id === option?.id ? undefined : id;
			return;
		}
		if (id === option?.id) return;
		decide(shown === "approved" ? "approved" : "changed", id);
	}

	function confirm() {
		const id = stagedOption?.id;
		staged = undefined;
		if (id) decide(shown === "approved" ? "approved" : "changed", id);
	}
</script>

<article
	class="beat tone-{kind?.tone ?? 'neutral'}"
	class:compact
	class:current
	data-beat={beat.id}
	data-state={shown}
	tabindex="-1"
	aria-label="{kind?.label ?? beat.kind} at {beat.at}"
	onfocusin={() => (app.beatId = beat.id)}
	onpointerdown={() => (app.beatId = beat.id)}
>
	<div class="media" class:dim={shown === "skipped"}>
		<Preview option={shownOption} pending={beat.pending} {kind} {autoplay} />
	</div>
	<div class="body">
		<div class="meta">
			<span class="chip tinted"
				>{#if kind}<Icon name={kind.icon} small />{/if}{kind?.label ?? beat.kind}</span
			>
			{#if option?.alpha}<span class="chip">Transparent</span>{/if}
			<span class="at num">{beat.at}</span>
			{#if shown !== hideState}<span class="state s-{shown}"><Swap value={STATE_LABEL[shown]} /></span
				>{/if}
			{#if beat.orphaned}<span class="chip" data-tip="That moment was cut.">Line cut</span
				>{/if}
			{#if noted > 0}<span class="chip tinted tone-accent"
					><Icon name="note" small /><Swap value={noted} /></span
				>{/if}
		</div>
		<p class="line">{beat.line}</p>

		{#if beat.options.length > 1}
			<div class="opts" role="radiogroup" aria-label="Choices">
				{#each beat.options as opt (opt.id)}
					<button
						class="opt"
						role="radio"
						aria-checked={opt.id === shownOption?.id}
						data-staged={opt.id === stagedOption?.id || undefined}
						title={opt.meta ?? opt.name}
						onclick={() => choose(opt.id)}>{opt.name}</button
					>
				{/each}
			</div>
		{:else if option && !compact}
			<p class="name">
				{option.name}{#if option.meta && !option.alpha}<span> {option.meta}</span>{/if}
			</p>
		{/if}

		<div class="acts">
			{#if stagedOption}
				<button class="btn" class:primary={current} class:solid={!current} onclick={confirm}
					>Use {stagedOption.name}</button
				>
				<button class="btn solid" onclick={() => (staged = undefined)}>Cancel</button>
			{:else if isOpenBeat(beat) || beat.orphaned}
				{#if !beat.orphaned}
					<button
						class="btn"
						class:primary={current}
						class:solid={!current}
						onclick={() => decide("approved")}
						>Keep<Kbd combo="y" /></button
					>
				{/if}
				<button class="btn solid" onclick={() => decide("skipped")}>Skip<Kbd combo="n" /></button>
			{:else if beat.state === "proposed"}
				<button class="btn solid" onclick={() => decide("skipped")}>Skip<Kbd combo="n" /></button>
			{:else}
				<button class="btn solid" onclick={() => decide("proposed")}
					><Icon name="undo" small />Undo<Kbd combo="u" /></button
				>
			{/if}
			<button class="btn" onclick={() => app.compose.start({ kind: "beat", beat: beat.id })}
				><Icon name="note" small />Note<Kbd combo="c" /></button
			>
		</div>
	</div>
</article>

<style>
	.beat {
		display: grid;
		grid-template-columns: minmax(160px, 26%) minmax(0, 1fr);
		gap: 12px;
		padding: 8px;
		border: 1px solid var(--line-soft);
		border-radius: var(--radius-lg);
		background: var(--surface);
		scroll-margin: 96px 0 24px;
		outline: none;
		transition:
			border-color var(--duration-fast) var(--ease-smooth-out),
			background-color var(--duration-fast) var(--ease-smooth-out),
			box-shadow var(--duration-fast) var(--ease-smooth-out);
	}
	.beat:hover {
		border-color: var(--line);
	}
	.beat.current {
		border-color: var(--accent);
		background: var(--raised);
	}
	.beat[data-state="approved"] {
		background: color-mix(in oklab, var(--ok) 4%, var(--surface));
	}
	.beat.compact {
		grid-template-columns: minmax(130px, 24%) minmax(0, 1fr);
		margin: 8px 0 14px;
		background: var(--raised);
	}
	.media {
		align-self: start;
		transition: opacity var(--duration-fast) var(--ease-smooth-out);
	}
	.media.dim {
		opacity: 0.45;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
		container-type: inline-size;
	}
	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
	}
	.at {
		color: var(--dim);
		font: 500 var(--fs-xs) / 1 var(--mono);
	}
	.state {
		margin-left: auto;
		color: var(--faint);
		font-size: var(--fs-xs);
		font-weight: 500;
	}
	.s-approved {
		color: var(--ok);
	}
	.s-changed {
		color: var(--warn-text);
	}
	.line {
		font-size: var(--fs-md);
		line-height: 1.5;
		text-wrap: pretty;
	}
	.name {
		color: var(--dim);
		font-size: var(--fs-xs);
		overflow-wrap: anywhere;
	}
	.name span {
		color: var(--faint);
	}
	.opts {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.opt {
		max-width: 100%;
		min-height: 26px;
		padding: 0 9px;
		overflow: hidden;
		border-radius: var(--radius-sm);
		color: var(--dim);
		font-size: var(--fs-xs);
		text-overflow: ellipsis;
		white-space: nowrap;
		transition:
			border-color var(--duration-quick) var(--ease-smooth-out),
			background-color var(--duration-quick) var(--ease-smooth-out),
			color var(--duration-quick) var(--ease-smooth-out),
			transform var(--duration-micro) var(--ease-smooth-out);
	}
	.opt:hover {
		background: var(--hover);
		color: var(--text);
	}
	.opt:active {
		transform: scale(var(--scale-medium));
	}
	.opt[aria-checked="true"] {
		background: var(--accent-soft);
		color: var(--text);
	}
	.acts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		margin-top: auto;
		padding-top: 4px;
	}
	.acts :global(kbd) {
		margin-left: 2px;
		border-color: color-mix(in oklab, currentColor 30%, transparent);
		background: transparent;
		color: inherit;
		opacity: 0.75;
		transition: opacity var(--duration-quick) var(--ease-smooth-out);
	}
	/* Keep, Skip and Comment share one row: a column too narrow for their key hints drops the hints first. */
	@container (max-width: 540px) {
		.acts :global(kbd) {
			display: none;
		}
	}
	@media (max-width: 760px) {
		.beat,
		.beat.compact {
			grid-template-columns: 1fr;
			gap: 12px;
		}
		.acts :global(kbd) {
			display: none;
		}
	}
</style>
