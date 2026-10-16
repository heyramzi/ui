<script lang="ts">
	import { isOpenScreen } from "#src/core/openscreen.js";
	import { useApp } from "#src/hooks/app.svelte.js";
	import BeatsView from "#src/ui/BeatsView.svelte";
	import HandoffView from "#src/ui/HandoffView.svelte";
	import Empty from "#src/ui/Empty.svelte";
	import MusicView from "#src/ui/MusicView.svelte";
	import OpenScreenBar from "#src/ui/OpenScreenBar.svelte";
	import Resizer from "#src/ui/Resizer.svelte";
	import Stage from "#src/ui/Stage.svelte";
	import StageSkeleton from "#src/ui/StageSkeleton.svelte";
	import TranscriptView from "#src/ui/TranscriptView.svelte";

	const app = useApp();
	const model = $derived(app.review.model);
	const pass = $derived(app.pass.selected);
	const openScreen = $derived(isOpenScreen(model));
	/** Before the model, a host that named the shape gets the stage's skeleton in it. */
	const waiting = $derived(!model && !app.review.loadError && app.ratio !== undefined);
	const staged = $derived(Boolean(model?.player) || waiting);
</script>

<main class="main">
	{#if openScreen}
		<OpenScreenBar id={model?.id ?? ""} onSync={() => app.review.reload()} />
	{/if}
	<div
		class="body"
		class:side={staged && app.player.portrait}
		style:--pane-w={app.panels.paneCss}
	>
		{#if model?.player}<Stage player={model.player} />
		{:else if waiting}<StageSkeleton ratio={app.player.ratio} />{/if}
		{#if staged && app.player.portrait && !app.panels.narrow}<Resizer side="pane" />{/if}
		<div class="pane-scroll">
			{#if app.review.loadError && !model}
				<Empty icon="alert" title="Couldn't load this video" hint="If it keeps failing, your agent can fix it.">
					<button class="btn solid" onclick={() => void app.review.refresh()}>Try again</button>
				</Empty>
			{:else if !model}
				<div class="loading">
					<span class="skel h"></span><span class="skel l"></span><span class="skel l"></span><span
						class="skel l s"
					></span>
				</div>
			{:else}
				{#if model.error}
					<div class="problem" role="alert">
						<div>
							<p><b>This video has a problem.</b> Your agent can fix it.</p>
							<details><summary>Details for your agent</summary>{model.error}</details>
						</div>
						<button class="btn solid" onclick={() => void app.review.refresh()}
							>Try again</button
						>
					</div>
				{/if}
				{#if pass}
					{#key pass.id}
						<div class="page" data-pass-view={pass.id}>
							{#if pass.view === "transcript"}<TranscriptView {pass} />
							{:else if pass.view === "beats"}<BeatsView {pass} />
							{:else if pass.view === "music"}<MusicView {pass} />
							{:else if pass.view === "handoff"}<HandoffView {pass} />{/if}
						</div>
					{/key}
				{:else}
					<Empty
						icon="layout"
						title="Ask your agent to start"
						hint="Each step opens here as your agent gets to it."
					/>
				{/if}
			{/if}
		</div>
	</div>
</main>

<style>
	.main {
		grid-area: main;
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		background: var(--ground);
		container: main / inline-size;
	}
	.body {
		position: relative;
		display: flex;
		flex: 1;
		flex-direction: column;
		min-height: 0;
	}
	/* Under 700px the pass sits above the video, so there's no edge to drag. */
	.body :global(.at-pane) {
		display: none;
	}
	/* A vertical cut leaves the width empty, so the pass reads beside the video, timeline below. The pass takes 480px or more and the frame sizes the rest, so a Short never shrinks to a sliver. */
	@container main (min-width: 700px) {
		.body.side {
			display: grid;
			grid-template:
				"pane viewer" minmax(0, 1fr) "track track" auto / min(var(--pane-w), 62%)
				minmax(0, 1fr);
		}
		.side .pane-scroll {
			grid-area: pane;
			border-right: 1px solid var(--line-soft);
		}
		.side :global(.at-pane) {
			display: block;
		}
	}
	.pane-scroll {
		flex: 1;
		min-height: 0;
		overflow: hidden auto;
		scroll-behavior: auto;
	}
	.page {
		animation: page-in var(--page-slide-dur) var(--ease-smooth-out) both;
	}
	@keyframes page-in {
		from {
			opacity: 0;
			transform: translateX(var(--page-slide-distance));
			filter: blur(var(--page-blur));
		}
	}
	.loading {
		display: grid;
		gap: 12px;
		max-width: 760px;
		margin: 0 auto;
		padding: 28px var(--gutter);
	}
	.h {
		width: 40%;
		height: 26px;
	}
	.l {
		height: 72px;
	}
	.s {
		width: 70%;
	}
	.problem {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin: 16px var(--gutter) 0;
		padding: 10px 12px;
		border: 1px solid color-mix(in oklab, var(--bad) 45%, var(--line));
		border-radius: var(--radius);
		background: var(--bad-soft);
		font-size: var(--fs-xs);
	}
</style>
