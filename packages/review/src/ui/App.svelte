<script lang="ts">
	import { untrack } from "svelte";
	import type { ReviewClient } from "#src/client/http.js";
	import { createApp, provideApp } from "#src/hooks/app.svelte.js";
	import AgentDock from "#src/ui/AgentDock.svelte";
	import Feedback from "#src/ui/Feedback.svelte";
	import Header from "#src/ui/Header.svelte";
	import Main from "#src/ui/Main.svelte";
	import MobileTabs from "#src/ui/MobileTabs.svelte";
	import Rail from "#src/ui/Rail.svelte";
	import Resizer from "#src/ui/Resizer.svelte";
	import SelectionButton from "#src/ui/SelectionButton.svelte";

	let { client, backHref, ratio }: { client: ReviewClient; backHref: string; ratio?: number } =
		$props();
	// svelte-ignore state_referenced_locally
	const app = provideApp(createApp({ client, backHref, ratio }));
	const p = app.panels;
	let root = $state<HTMLElement>();
	$effect(() => {
		app.root = root ?? null;
	});
	// A picked step closes the steps sheet and shows its work.
	$effect(() => {
		void app.pass.selected?.id;
		untrack(() => p.hideSteps());
	});
</script>

<div
	class="rv shell"
	class:dragging={p.dragging}
	class:no-rail={!p.railOpen}
	class:no-panel={!p.panelShown}
	class:narrow={p.narrow}
	class:compact={p.compact}
	style:--rail-w="{p.railOpen ? (p.compact ? 56 : p.railW) : 0}px"
	style:--panel-w={p.panelCss}
	bind:this={root}
>
	<Header />
	<div class="rail-wrap" inert={p.narrow ? !p.stepsShown : !p.railOpen}>
		<Rail />
		<AgentDock />
		{#if !p.narrow && !p.compact}<Resizer side="rail" />{/if}
	</div>
	<Main />
	<div class="panel-wrap" class:sheet={p.narrow} inert={!p.panelShown}>
		<Feedback />
		{#if !p.narrow}<Resizer side="panel" />{/if}
	</div>
	<MobileTabs />
	<SelectionButton />
</div>

<style>
	.shell {
		position: relative;
		display: grid;
		grid-template:
			"head head head" 52px
			"rail main panel" minmax(0, 1fr)
			/ var(--rail-w) minmax(0, 1fr) var(--panel-w);
		width: 100%;
		height: 100%;
		min-height: 0;
		overflow: hidden;
		transition: grid-template-columns var(--panel-open-dur) var(--ease-smooth-out);
	}
	.shell.no-panel {
		grid-template-columns: var(--rail-w) minmax(0, 1fr) 0;
		transition-duration: var(--panel-close-dur);
	}
	.shell.dragging {
		transition: none;
		user-select: none;
	}
	.rail-wrap,
	.panel-wrap {
		position: relative;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		display: grid;
	}
	.rail-wrap {
		grid-area: rail;
		grid-template-rows: minmax(0, 1fr) auto;
		border-right: 1px solid var(--line-soft);
	}
	.panel-wrap {
		grid-area: panel;
		border-left: 1px solid var(--line-soft);
	}
	.no-rail .rail-wrap,
	.no-panel .panel-wrap:not(.sheet) {
		border-width: 0;
	}
	.rail-wrap > :global(.rail),
	.panel-wrap > :global(.panel) {
		min-width: 0;
	}
	.panel-wrap > :global(.panel) {
		width: var(--panel-w);
	}

	/* A phone: the video stays pinned under the header, and the pass, the notes or the steps fill the rest. Tabs at the bottom pick which. */
	@media (max-width: 900px) {
		.shell,
		.shell.no-panel {
			--frame-h: min(28dvh, 240px);
			--stage-h: calc(var(--frame-h) + 96px);
			grid-template:
				"head" auto
				"main" minmax(0, 1fr)
				"tabs" auto
				/ minmax(0, 1fr);
		}
		.rail-wrap,
		.panel-wrap.sheet {
			grid-area: main;
			z-index: 60;
			margin-top: var(--stage-h);
			border: 0;
			background: var(--surface);
			border-top: 1px solid var(--line-soft);
			transform: translateY(16px);
			opacity: 0;
			visibility: hidden;
			transition:
				transform var(--panel-close-dur) var(--ease-smooth-out),
				opacity var(--panel-close-dur) var(--ease-smooth-out),
				visibility 0s linear var(--panel-close-dur);
		}
		.rail-wrap:not([inert]),
		.panel-wrap.sheet:not([inert]) {
			transform: none;
			opacity: 1;
			visibility: visible;
			transition:
				transform var(--panel-open-dur) var(--ease-smooth-out),
				opacity var(--panel-open-dur) var(--ease-smooth-out),
				visibility 0s;
		}
		.panel-wrap.sheet > :global(.panel) {
			width: 100%;
		}
	}
	/* A tablet shows the pass beside the video (Main's side layout), so the sheets cover only that column. */
	@media (min-width: 700px) and (max-width: 900px) {
		.rail-wrap,
		.panel-wrap.sheet {
			width: min(400px, 60%);
			margin-top: 0;
		}
	}
	@media (max-width: 900px) and (prefers-reduced-motion: reduce) {
		.rail-wrap,
		.panel-wrap.sheet {
			transform: none;
			transition: none;
		}
	}
</style>
