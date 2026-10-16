<!-- ========================== -->
<!-- IMPORTS                    -->
<!-- ========================== -->
<script lang="ts">
	// Every shadcn primitive this package ships, demoed by upstream's own example
	// and listed by the sync. Nothing here is typed by hand: see
	// ../../docs/decisions.md and `pnpm sync:shadcn`.
	import { TooltipProvider } from "#src/shadcn/tooltip/index.js";
	import ShowcaseStage from "#src/showcase/ShowcaseStage.svelte";
	import { SHADCN_DEMOS } from "#src/showcase/demos/shadcn/index.js";
	import "#src/showcase/stacked-section.css";
</script>

<!-- ========================== -->
<!-- MARKUP                     -->
<!-- ========================== -->
<!-- The provider an app mounts once at its root: upstream's demos assume one is
     there, and `input-group` throws without it. -->
<TooltipProvider>
	<div class="sc-stacked">
		{#each SHADCN_DEMOS as demo (demo.name)}
			<ShowcaseStage title={demo.title} note={demo.note} importPath={demo.path} tag="shadcn" wide>
				<demo.Comp />
			</ShowcaseStage>
		{/each}
	</div>
</TooltipProvider>
