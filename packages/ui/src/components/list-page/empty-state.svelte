<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { Button } from "#src/shadcn/button/index.js";
	import * as Empty from "#src/shadcn/empty/index.js";
	import type { PhosphorIcon, IconWeight } from "#src/lib/icon-types.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		icon?: PhosphorIcon;
		iconWeight?: IconWeight;
		title: string;
		description?: string;
		actionLabel?: string;
		actionHref?: string;
		onAction?: () => void;
	}

	// =========================
	// PROPS
	// =========================
	let {
		icon: Icon,
		iconWeight,
		title,
		description,
		actionLabel,
		actionHref,
		onAction,
	}: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- The four parts arrive in reading order. The stagger is what says the page
     finished loading and is simply empty. -->
<Empty.Root class="t-empty py-16">
	<Empty.Header class="max-w-md">
		{#if Icon}
			<Empty.Media class="mb-4 size-16 rounded-2xl bg-brand/10 text-brand">
				<Icon weight={iconWeight} class="size-8" />
			</Empty.Media>
		{/if}
		<Empty.Title class="font-heading text-lg font-semibold [overflow-wrap:anywhere]"
			>{title}</Empty.Title
		>
		{#if description}
			<Empty.Description>{description}</Empty.Description>
		{/if}
	</Empty.Header>
	{#if actionLabel && (actionHref || onAction)}
		<Empty.Content>
			{#if actionHref}
				<Button href={actionHref}>{actionLabel}</Button>
			{:else}
				<Button onclick={onAction}>{actionLabel}</Button>
			{/if}
		</Empty.Content>
	{/if}
</Empty.Root>

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
	/* Never `:nth-child` here: one such rule makes every DOM insert on the page restyle its later siblings. */
	:global(.t-empty) > :global(*) {
		animation: t-empty-in var(--duration-slow) var(--ease-smooth-out) both;
		animation-delay: calc((sibling-index() - 1) * var(--duration-stagger));
	}

	@keyframes -global-t-empty-in {
		from {
			opacity: 0;
			transform: translateY(var(--distance-small));
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.t-empty) > :global(*) {
			animation-duration: 1ms;
			animation-delay: 0ms;
		}
	}
</style>
