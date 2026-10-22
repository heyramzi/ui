<script lang="ts">
	import DemoStage from "#lib/DemoStage.svelte";

	let resizeSmall = $state(false);
</script>

<DemoStage
	title="Card resize"
	note="Smooth width and height transition"
	importPath={"import '@heyramzi/ui/animations/resize.css';"}
	onaction={() => (resizeSmall = !resizeSmall)}
>
	<div class="t-resize sk-card" class:is-small={resizeSmall}>
		<span class="sk sk-1"></span>
		<span class="sk sk-2"></span>
		<span class="sk sk-3"></span>
		<span class="sk sk-4"></span>
		<span class="sk sk-5"></span>
		<span class="sk sk-6"></span>
	</div>
</DemoStage>

<style>
	.sk {
		background: var(--td-skeleton);
		border-radius: 4px;
	}

	.sk-card {
		position: relative;
		width: 12.5rem;
		height: 8.75rem;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		border-radius: 12px;
		/* WHY: clip the skeleton lines so they don't spill past the card edge as it shrinks */
		overflow: hidden;
	}
	.sk-card.is-small {
		width: 9rem;
		height: 6rem;
	}
	.sk-card .sk {
		position: absolute;
		left: 14px;
		right: 14px;
	}
	.sk-card .sk-1 {
		top: 16px;
		height: 10px;
		right: auto;
		width: 56%;
	}
	.sk-card .sk-2 {
		top: 32px;
		height: 6px;
	}
	.sk-card .sk-3 {
		top: 44px;
		height: 6px;
	}
	.sk-card .sk-4 {
		top: 56px;
		height: 6px;
		right: auto;
		width: 70%;
	}
	.sk-card .sk-5 {
		top: 84px;
		height: 6px;
	}
	.sk-card .sk-6 {
		top: 96px;
		height: 6px;
	}
</style>
