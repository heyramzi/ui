<script lang="ts" module>
	export interface ShowcaseImportProps {
		/** The line a consumer pastes, e.g. `@heyramzi/ui/shadcn/button`. */
		path: string;
		/** Accessible name suffix, so two rows on a page do not both read "Copy import". */
		label?: string;
		class?: string;
	}
</script>

<script lang="ts">
	import { cn } from "@heyramzi/utils";
	import checkIcon from "#src/showcase/check.svg?raw";
	import copyIcon from "#src/showcase/copy.svg?raw";

	let { path, label, class: className }: ShowcaseImportProps = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		try {
			await navigator.clipboard.writeText(path);
		} catch {
			// A denied clipboard is not worth an error state on a dev-only surface;
			// the path is on screen and selectable either way.
			return;
		}
		copied = true;
		clearTimeout(timer);
		timer = setTimeout(() => (copied = false), 1600);
	}
</script>

<button
	type="button"
	class={cn("sc-import", className)}
	data-copied={copied ? "true" : undefined}
	onclick={copy}
	aria-label="Copy import for {label ?? path}"
>
	<code>{path}</code>
	<span class="sc-import-state" aria-hidden="true">
		{#if copied}
			{@html checkIcon}
		{:else}
			{@html copyIcon}
		{/if}
	</span>
</button>

<style>
	.sc-import {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		width: 100%;
		min-width: 0;
		padding: 0.375rem 0.5rem 0.375rem 0.625rem;
		border: 1px solid transparent;
		border-radius: 0.5rem;
		background: transparent;
		color: var(--color-muted-foreground, var(--muted-foreground));
		cursor: pointer;
		text-align: start;
		transition:
			color 160ms ease,
			background-color 160ms ease,
			border-color 160ms ease;
	}

	.sc-import:hover {
		color: var(--color-foreground, var(--foreground));
		background: color-mix(in oklab, var(--color-muted, var(--muted)) 70%, transparent);
	}

	.sc-import:focus-visible {
		outline: 2px solid var(--color-ring, var(--ring));
		outline-offset: 2px;
	}

	.sc-import[data-copied] {
		color: var(--color-foreground, var(--foreground));
		border-color: color-mix(in oklab, var(--color-ring, var(--ring)) 45%, transparent);
	}

	.sc-import code {
		font-family: var(--font-mono, ui-monospace, "SF Mono", "JetBrains Mono", monospace);
		font-size: 0.6875rem;
		letter-spacing: -0.01em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.sc-import-state {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 0.875rem;
		height: 0.875rem;
	}

	.sc-import-state :global(svg) {
		width: 100%;
		height: 100%;
		animation: sc-icon-in 200ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	@keyframes sc-icon-in {
		from {
			opacity: 0;
			transform: scale(0.6);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sc-import {
			transition: none;
		}
		.sc-import-state :global(svg) {
			animation: none;
		}
	}
</style>
