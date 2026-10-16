<script lang="ts">
	import { useApp } from "#src/hooks/app.svelte.js";
	import Icon from "#src/components/icons/Icon.svelte";

	const app = useApp();
	const anchor = $derived(app.selection.anchor);
	const target = $derived(app.selection.target);

	function comment() {
		if (!target) return;
		app.compose.start(target);
		app.selection.clear();
		app.panels.showPanel();
	}
</script>

{#if anchor && target}
	<!-- WHY: pointerdown is stopped so the click doesn't collapse the selection first. -->
	<button
		class="float btn solid"
		style:left="{anchor.x}px"
		style:top="{anchor.y}px"
		onpointerdown={(e) => e.preventDefault()}
		onclick={comment}
	>
		<Icon name="note" small />Comment
	</button>
{/if}

<style>
	.float {
		position: fixed;
		z-index: 60;
		translate: -50% calc(-100% - 8px);
		box-shadow: var(--shadow-lift);
		animation: rv-swap var(--duration-quick) var(--ease-in-out) both;
	}
</style>
