<script lang="ts" module>
	export interface ShowcaseListItem {
		/** Component name, e.g. "Context Menu". */
		title: string;
		/** Import line for the copy control. */
		importPath: string;
		/** Right-hand detail: a file count, a parts count, a source path. */
		meta?: string;
		/** Provenance beside the name, e.g. "shadcn" on a primitive the kit took as is. */
		tag?: string;
	}

	export interface ShowcaseListProps {
		items: ShowcaseListItem[];
		/** Heading above the rows. Omit inside a section that is list-only. */
		caption?: string;
	}
</script>

<script lang="ts">
	import ShowcaseImport from "#src/showcase/ShowcaseImport.svelte";
	import "#src/showcase/showcase-shell.css";

	let { items, caption }: ShowcaseListProps = $props();
</script>

<!-- WHY a row and not a stage: a component with no demo has one useful fact, its
     import line. Given a card each, the undemoed majority buries the demos. -->
<div class="sc-list">
	{#if caption}
		<p class="sc-list-caption">{caption}</p>
	{/if}
	<ul>
		{#each items as item (item.importPath)}
			<li>
				<span class="sc-list-title">
					{item.title}
					{#if item.tag}
						<span class="sc-tag">{item.tag}</span>
					{/if}
				</span>
				<ShowcaseImport path={item.importPath} label={item.title} class="sc-list-import" />
				{#if item.meta}
					<span class="sc-list-meta">{item.meta}</span>
				{/if}
			</li>
		{/each}
	</ul>
</div>

<style>
	.sc-list {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.sc-list-caption {
		margin: 0;
		font-size: 0.6875rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-muted-foreground, var(--muted-foreground));
	}

	.sc-list ul {
		list-style: none;
		margin: 0;
		padding: 0;
		border: 1px solid var(--color-border, var(--border));
		border-radius: calc(var(--radius, 0.625rem) + 0.375rem);
		background: var(--color-card, var(--card));
		overflow: hidden;
	}

	.sc-list li {
		position: relative;
		display: grid;
		grid-template-columns: minmax(7rem, 12rem) minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.1875rem 0.75rem 0.1875rem 1rem;
		min-height: 2.5rem;
	}

	/* Inset to the title column, so a scan down the names is not cut by a full-bleed
   rule on every row. */
	.sc-list li + li::before {
		content: "";
		position: absolute;
		inset-block-start: 0;
		inset-inline: 1rem 0;
		height: 1px;
		background: var(--color-border, var(--border));
	}

	.sc-list-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-card-foreground, var(--color-foreground, var(--foreground)));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.sc-list-meta {
		font-size: 0.6875rem;
		font-variant-numeric: tabular-nums;
		color: var(--color-muted-foreground, var(--muted-foreground));
		white-space: nowrap;
	}

	@media (max-width: 40rem) {
		.sc-list li {
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-areas:
				"title meta"
				"import import";
			padding-block: 0.5rem;
		}
		.sc-list-title {
			grid-area: title;
		}
		.sc-list-meta {
			grid-area: meta;
		}
		.sc-list :global(.sc-list-import) {
			grid-area: import;
		}
	}
</style>
