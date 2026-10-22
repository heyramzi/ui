<script lang="ts">
	import DemoStage from "#lib/DemoStage.svelte";

	let modalOpen = $state(true);
</script>

<DemoStage
	title="Modal open / close"
	note="Scale and blur transition"
	importPath={"import '@heyramzi/ui/animations/modal.css';"}
	onaction={() => (modalOpen = !modalOpen)}
>
	<div class="t-modal sk-modal" class:is-open={modalOpen}>
		<div class="sk sk-mtitle"></div>
		<div class="sk sk-mclose"></div>
		<div class="sk sk-line full"></div>
		<div class="sk sk-line full"></div>
		<div class="sk sk-line three-q"></div>
		<div class="sk-pills">
			<div class="sk sk-pill"></div>
			<div class="sk sk-pill"></div>
		</div>
	</div>
</DemoStage>

<style>
	.sk {
		background: var(--td-skeleton);
		border-radius: 4px;
	}

	.sk-modal {
		position: relative;
		width: 16rem;
		height: 10rem;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		border: 0;
		border-radius: 12px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.4375rem;
	}
	.sk-modal .sk-mtitle {
		width: 60%;
		height: 12px;
	}
	.sk-modal .sk-mclose {
		position: absolute;
		top: 0.875rem;
		right: 0.875rem;
		width: 14px;
		height: 14px;
		border-radius: 50%;
	}
	.sk-modal .sk-line {
		height: 8px;
	}
	.sk-modal .sk-line.full {
		width: 100%;
	}
	.sk-modal .sk-line.three-q {
		width: 75%;
	}
	.sk-modal .sk-pills {
		margin-top: auto;
		display: flex;
		gap: 0.5rem;
	}
	.sk-modal .sk-pill {
		width: 4.25rem;
		height: 1.375rem;
		border-radius: 999px;
	}
</style>
