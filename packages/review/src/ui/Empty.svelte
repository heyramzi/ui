<script lang="ts">
	import type { IconName } from "#src/core/types.js";
	import type { Snippet } from "svelte";
	import Icon from "#src/components/icons/Icon.svelte";

	let {
		icon,
		title,
		hint,
		large = false,
		children,
	}: {
		icon: IconName;
		title: string;
		hint?: string;
		large?: boolean;
		children?: Snippet;
	} = $props();
</script>

<div class="empty" class:large>
	<span class="badge"><Icon name={icon} /></span>
	<p class="title">{title}</p>
	{#if hint}<p class="hint">{hint}</p>{/if}
	{#if children}<div class="actions">{@render children()}</div>{/if}
</div>

<style>
	.empty {
		display: grid;
		justify-items: center;
		gap: 6px;
		padding: 40px 24px;
		text-align: center;
		animation: rv-swap var(--duration-fast) var(--ease-in-out) both;
	}
	.badge {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		margin-bottom: 4px;
		border-radius: var(--radius);
		background: var(--raised);
		color: var(--dim);
	}
	.title {
		font-weight: 600;
		font-size: var(--fs-sm);
	}
	.hint {
		max-width: 34ch;
		color: var(--dim);
		font-size: var(--fs-xs);
	}
	/* A whole pass with nothing in it: bigger mark, room above, and the next step in reach. */
	.large {
		gap: 8px;
		padding: 72px 24px;
	}
	.large .badge {
		width: 48px;
		height: 48px;
		margin-bottom: 8px;
	}
	.large .title {
		font-size: var(--fs-lg);
	}
	.large .hint {
		max-width: 44ch;
		font-size: var(--fs-sm);
		line-height: 1.5;
	}
	.actions :global(a.btn) {
		text-decoration: none;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		margin-top: 8px;
	}
</style>
