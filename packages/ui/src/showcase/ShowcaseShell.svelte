<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { ShowcaseSectionMeta } from "#src/showcase/types.js";

	export interface ShowcaseShellProps {
		/** Every section the rail lists, in the order the page renders them. */
		sections: ShowcaseSectionMeta[];
		/** Search box, filters, anything that acts on the whole page. Spans both columns. */
		controls?: Snippet;
		/** Sits at the top of the rail, above the index. A title, a count, a legend. */
		railHead?: Snippet;
		/** The sections themselves. */
		children: Snippet;
		/** Rendered instead of the rail and the sections, e.g. a search result list. */
		override?: Snippet;
	}
</script>

<script lang="ts">
	import ShowcaseNav from "#src/showcase/ShowcaseNav.svelte";
	import "#src/showcase/showcase-shell.css";

	let { sections, controls, railHead, children, override }: ShowcaseShellProps = $props();
</script>

<div class="sc-shell">
	{#if controls}
		<div class="sc-shell-controls">
			{@render controls()}
		</div>
	{/if}

	{#if override}
		<div class="sc-shell-override">
			{@render override()}
		</div>
	{:else}
		<div class="sc-shell-body">
			<!-- A landmark of its own, because the index is a second way through the
           page rather than part of the page's content. -->
			<aside class="sc-shell-rail">
				{#if railHead}
					<div class="sc-shell-rail-head">
						{@render railHead()}
					</div>
				{/if}
				<ShowcaseNav {sections} />
			</aside>

			<div class="sc-shell-main">
				{@render children()}
			</div>
		</div>
	{/if}
</div>
