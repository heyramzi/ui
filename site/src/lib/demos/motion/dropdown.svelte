<script lang="ts">
	import DemoStage from "#lib/DemoStage.svelte";

	let dropdownOpen = $state(true);
</script>

<DemoStage
	title="Menu dropdown"
	note="Origin-aware open and close"
	importPath={"import '@heyramzi/ui/animations/dropdown.css';"}
	onaction={() => (dropdownOpen = !dropdownOpen)}
>
	<div class="dropdown-stack">
		<div class="sk-trigger"></div>
		<div class="t-dropdown sk-dropdown" class:is-open={dropdownOpen}>
			<div class="sk sk-row full"></div>
			<div class="sk sk-row three-q"></div>
			<div class="sk sk-row half"></div>
		</div>
	</div>
</DemoStage>

<style>
	.sk {
		background: var(--td-skeleton);
		border-radius: 4px;
	}

	.dropdown-stack {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}
	.sk-trigger {
		width: 7rem;
		height: 2rem;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		border-radius: 8px;
	}
	.sk-dropdown {
		width: 11rem;
		padding: 0.625rem;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		border: 0;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		gap: 0.4375rem;
	}
	.sk-dropdown .sk-row {
		height: 9px;
	}
	.sk-dropdown .sk-row.full {
		width: 100%;
	}
	.sk-dropdown .sk-row.three-q {
		width: 75%;
	}
	.sk-dropdown .sk-row.half {
		width: 50%;
	}
</style>
