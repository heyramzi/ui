<script lang="ts">
	import DemoStage from "#lib/DemoStage.svelte";
	import chevronArms from "#lib/demos/motion/chevron-arms.svg?raw";
</script>

<DemoStage
	title="Learn more hover"
	note="Chevron shifts, its arms open"
	importPath={"import '@heyramzi/ui/animations/learn-more-hover.css';"}
>
	<button type="button" class="t-learn learn-demo">
		Learn more
		<span class="t-learn-chevron">
			{@html chevronArms}
		</span>
	</button>
</DemoStage>

<style>
	.learn-demo {
		display: inline-flex;
		align-items: center;
		gap: 0.4375rem;
		padding: 0.5rem 0.875rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--td-text);
		background: var(--td-copy-bg);
		border: 0;
		border-radius: 8px;
		cursor: pointer;
	}
</style>
