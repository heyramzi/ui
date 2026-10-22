<script lang="ts">
	import DemoStage from "#lib/DemoStage.svelte";

	let activePage = $state<"1" | "2">("1");

	function togglePage() {
		activePage = activePage === "1" ? "2" : "1";
	}
</script>

<DemoStage
	title="Page side-by-side"
	note="Forward and back page slide"
	importPath={"import '@heyramzi/ui/animations/page-side-by-side.css';"}
	actionLabel={activePage === "1" ? "Next" : "Back"}
	onaction={togglePage}
>
	<div class="t-page-slide sk-page-stage" data-page={activePage}>
		<section class="t-page sk-page" data-page-id="1">
			<div class="sk sk-row full"></div>
			<div class="sk sk-row three-q"></div>
			<div class="sk sk-row half"></div>
		</section>
		<section class="t-page sk-page sk-page-2" data-page-id="2">
			<div class="sk-amount">$10</div>
			<div class="sk-pill-row">
				<div class="sk sk-mini-pill"></div>
				<div class="sk sk-mini-pill"></div>
				<div class="sk sk-mini-pill"></div>
			</div>
		</section>
	</div>
</DemoStage>

<style>
	.sk {
		background: var(--td-skeleton);
		border-radius: 4px;
	}

	.sk-page-stage {
		position: relative;
		width: 16rem;
		height: 10rem;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		border-radius: 12px;
		overflow: hidden;
	}
	.sk-page {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.sk-page .sk-row {
		height: 10px;
	}
	.sk-page .sk-row.full {
		width: 100%;
	}
	.sk-page .sk-row.three-q {
		width: 75%;
	}
	.sk-page .sk-row.half {
		width: 50%;
	}
	.sk-page-2 {
		align-items: center;
		justify-content: center;
		gap: 0.625rem;
	}
	.sk-amount {
		font-size: 2rem;
		font-weight: 600;
		color: var(--td-text, var(--foreground));
		font-family: ui-monospace, SFMono-Regular, monospace;
	}
	.sk-pill-row {
		display: flex;
		gap: 0.375rem;
	}
	.sk-mini-pill {
		width: 2.5rem;
		height: 1.25rem;
		border-radius: 999px;
	}
</style>
