<script lang="ts">
	import DemoStage from "#lib/DemoStage.svelte";
	import plus from "#lib/demos/motion/plus.svg?raw";

	let morphOpen = $state(false);
</script>

<DemoStage
	title="Plus menu morph"
	note="The button becomes the surface"
	importPath={"import '@heyramzi/ui/animations/plus-menu-morph.css';"}
>
	<div class="morph-anchor">
		<div class="t-morph morph-demo" data-open={morphOpen ? "true" : "false"}>
			<div class="t-morph-menu morph-menu">
				<span>Duplicate</span>
				<span>Move to...</span>
				<span>Archive</span>
			</div>
			<button
				type="button"
				class="t-morph-plus morph-plus"
				aria-expanded={morphOpen}
				aria-label={morphOpen ? "Close menu" : "Open menu"}
				onclick={() => (morphOpen = !morphOpen)}
			>
				{@html plus}
			</button>
		</div>
	</div>
</DemoStage>

<style>
	/* The anchor is sized to the open footprint, the way the usage note asks:
	   without it the morph grows the stage and every demo under it jumps. */
	.morph-anchor {
		position: relative;
		width: 11rem;
		height: 7.5rem;
	}

	.morph-demo {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
	}

	.morph-menu {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 0.875rem;
		font-size: 0.8125rem;
		color: var(--td-text);
	}

	.morph-plus {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--td-text);
		background: none;
		border: 0;
		cursor: pointer;
	}
</style>
