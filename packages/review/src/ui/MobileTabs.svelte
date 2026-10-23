<script lang="ts">
	import { useApp } from "#src/hooks/app.svelte.js";
	import Icon from "#src/components/icons/Icon.svelte";

	const app = useApp();
	const p = app.panels;
	const tab = $derived(p.panelShown ? "notes" : p.stepsShown ? "steps" : "work");
</script>

<!-- A phone's way between the pass, the notes and the steps. The video stays above all three. -->
<nav class="tabs" aria-label="Sections">
	<button
		class="tab"
		aria-current={tab === "work" ? "page" : undefined}
		onclick={() => p.hideSheet()}><Icon name="check" />Work</button
	>
	<button
		class="tab"
		aria-current={tab === "notes" ? "page" : undefined}
		onclick={() => (tab === "notes" ? p.hideSheet() : p.showPanel())}
		><Icon name="note" />Notes</button
	>
	<button
		class="tab"
		aria-current={tab === "steps" ? "page" : undefined}
		onclick={() => (tab === "steps" ? p.hideSheet() : p.toggleSteps())}
		><Icon name="layout" />Steps</button
	>
</nav>

<style>
	.tabs {
		grid-area: tabs;
		position: relative;
		z-index: 80;
		display: none;
		grid-template-columns: repeat(3, 1fr);
		padding-bottom: env(safe-area-inset-bottom);
		border-top: 1px solid var(--line-soft);
		background: var(--surface);
	}
	.tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		min-height: 52px;
		padding: 6px 4px;
		border: 0;
		background: none;
		color: var(--dim);
		font: 600 var(--fs-xs) / 1 var(--sans, inherit);
		cursor: pointer;
		transition: color var(--duration-quick) var(--ease-smooth-out);
	}
	.tab[aria-current="page"] {
		color: var(--accent);
	}
	.tab:active {
		background: color-mix(in oklab, var(--text) 6%, transparent);
	}
	.tab:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -3px;
	}
	@media (max-width: 900px) {
		.tabs {
			display: grid;
		}
	}
</style>
