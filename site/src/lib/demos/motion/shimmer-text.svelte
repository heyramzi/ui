<script lang="ts">
	import DemoStage from "#lib/DemoStage.svelte";
</script>

<DemoStage
	title="Shimmer text"
	note="Sweeping highlight on a loop"
	importPath={"import '@heyramzi/ui/animations/shimmer-text.css';"}
>
	<span class="t-shimmer shimmer-demo" data-text="Generating response">Generating response</span>
</DemoStage>

<style>
	.shimmer-demo {
		font-size: 1.125rem;
		font-weight: 500;
		--shimmer-base: var(--td-text-subtle);
		--shimmer-highlight: var(--td-text);
	}
</style>
