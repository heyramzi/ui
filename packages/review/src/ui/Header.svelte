<script lang="ts">
	import { useApp } from "#src/hooks/app.svelte.js";
	import Icon from "#src/components/icons/Icon.svelte";
	import KeysMenu from "#src/ui/KeysMenu.svelte";
	import OpenInDescript from "#src/ui/OpenInDescript.svelte";
	import PacePill from "#src/ui/PacePill.svelte";
	import RenderFinal from "#src/ui/RenderFinal.svelte";
	import SaveStatus from "#src/ui/SaveStatus.svelte";
	import Swap from "#src/ui/Swap.svelte";

	const app = useApp();
	const model = $derived(app.review.model);

	// The tab reads the video's name, not the folder's.
	$effect(() => {
		if (!model?.title) return;
		const before = document.title;
		document.title = model.title;
		return () => {
			document.title = before;
		};
	});

	$effect(() => {
		const offs = [
			app.keys.bind({
				id: "rail.toggle",
				keys: ["["],
				label: "Show or hide the steps",
				group: "Everywhere",
				enabled: () => !app.panels.narrow,
				run: () => void app.panels.toggleRail(),
			}),
			app.keys.bind({
				id: "panel.toggle",
				keys: ["]"],
				label: "Show or hide the notes",
				group: "Everywhere",
				run: () => void app.panels.togglePanel(),
			}),
			app.keys.bind({
				id: "refresh",
				keys: ["r"],
				label: "Reload",
				group: "Everywhere",
				run: () => void app.review.refresh(),
			}),
		];
		return () => offs.forEach((off) => off());
	});
</script>

<header class="head">
	<!-- Each panel toggle sits over the panel it opens: steps on the left, notes on the right. -->
	<div class="left">
		<a class="btn icon" href={app.backHref} aria-label="Back" data-tip="Back"
			><Icon name="back" /></a
		>
		<button
			class="btn icon rail-toggle"
			aria-label="Steps"
			aria-pressed={app.panels.railOpen}
			data-tip="Steps ([)"
			onclick={() => app.panels.toggleRail()}
		>
			<Icon name="panel-left" />
		</button>
	</div>

	{#if model}
		<div class="title">
			<h1 title={model.title}>{model.title}</h1>
			<span class="route">{model.route}</span>
		</div>
		<div class="status tone-{model.status.tone}">
			<span class="dot"></span>
			<span class="words"><Swap value={model.status.text} /></span>
			<PacePill />
		</div>
	{:else}
		<div class="title"><span class="skel bar"></span></div>
	{/if}

	<div class="right">
		{#if model?.descript}<OpenInDescript links={model.descript} />{/if}
		<RenderFinal />
		<SaveStatus
			status={app.review.save}
			onretry={() => app.review.retry()}
		/>
		<button
			class="btn icon"
			class:spinning={app.review.reloading}
			aria-label="Reload"
			data-tip="Reload (R)"
			onclick={() => void app.review.refresh()}
		>
			<Icon name="refresh" />
		</button>
		<button
			class="btn icon"
			aria-label={app.theme.theme === "dark" ? "Light mode" : "Dark mode"}
			data-tip={app.theme.theme === "dark" ? "Light mode" : "Dark mode"}
			onclick={(event) => app.theme.toggle(event)}
		>
			<span class="icon-swap" data-state={app.theme.theme === "dark" ? "a" : "b"}>
				<span class="swap-icon" data-icon="a"><Icon name="sun" /></span>
				<span class="swap-icon" data-icon="b"><Icon name="moon" /></span>
			</span>
		</button>
		<KeysMenu />
		<button
			class="btn icon"
			aria-label="Notes"
			aria-pressed={app.panels.panelShown}
			data-tip="Notes (])"
			data-tip-end
			onclick={() => app.panels.togglePanel()}
		>
			<Icon name="panel-right" />
		</button>
	</div>
</header>

<style>
	.head {
		grid-area: head;
		/* Its tooltips hang over the panels below, so the header stacks above them. */
		position: relative;
		z-index: 45;
		display: flex;
		align-items: center;
		gap: 14px;
		min-width: 0;
		padding: 0 var(--gutter) 0 10px;
		border-bottom: 1px solid var(--line-soft);
		background: var(--surface);
	}
	.title {
		display: flex;
		align-items: baseline;
		gap: 10px;
		min-width: 0;
	}
	h1 {
		overflow: hidden;
		font: 650 var(--fs-md) / 1.2 var(--display);
		letter-spacing: -0.01em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.route {
		flex: none;
		color: var(--faint);
		font-size: var(--fs-xs);
		white-space: nowrap;
	}
	.bar {
		width: 180px;
		height: 14px;
	}
	.status {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: none;
		min-width: 0;
		max-width: 100%;
		padding-left: 14px;
		border-left: 1px solid var(--line-soft);
		font-size: var(--fs-xs);
		color: var(--text);
	}
	.words {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--tone);
		transition: background-color var(--duration-fast) var(--ease-smooth-out);
	}
	.left,
	.right {
		display: flex;
		align-items: center;
		gap: 4px;
		flex: none;
	}
	.right {
		margin-left: auto;
	}
	.icon-swap {
		display: inline-grid;
	}
	.swap-icon {
		grid-area: 1 / 1;
		display: grid;
		transition:
			opacity var(--duration-fast) var(--ease-in-out),
			filter var(--duration-fast) var(--ease-in-out),
			transform var(--duration-fast) var(--ease-in-out);
	}
	.icon-swap[data-state="a"] .swap-icon[data-icon="b"],
	.icon-swap[data-state="b"] .swap-icon[data-icon="a"] {
		opacity: 0;
		filter: blur(var(--blur-small));
		transform: scale(0.25);
	}
	@media (prefers-reduced-motion: reduce) {
		.swap-icon {
			transition: none;
		}
	}
	.spinning :global(.ic) {
		animation: spin var(--duration-loop) var(--ease-linear) infinite;
	}
	@keyframes spin {
		to {
			rotate: -360deg;
		}
	}
	@media (max-width: 1040px) {
		.route {
			display: none;
		}
	}
	@media (max-width: 900px) {
		.head {
			flex-wrap: wrap;
			row-gap: 0;
			padding: 6px var(--gutter) 6px 8px;
		}
		.title {
			flex: 1;
		}
		.status {
			order: 3;
			flex: 1 0 100%;
			flex-wrap: wrap;
			row-gap: 6px;
			padding: 4px 0 2px 8px;
			border-left: 0;
		}
		.left .rail-toggle {
			display: none;
		}
		/* One touch size, the same as the stage bar's buttons. */
		.head :global(.btn.icon) {
			width: 44px;
			min-height: 44px;
		}
		.status :global(.pace) {
			display: none;
		}
	}
</style>
