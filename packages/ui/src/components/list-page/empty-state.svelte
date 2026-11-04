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
<!-- transitions-dev texts reveal: the parts arrive in reading order, so the page reads as
     loaded and empty. Reduced motion keeps the fade. -->
<Empty.Root class="t-empty py-16">
	<Empty.Header class="max-w-md">
		{#if Icon}
			<!-- A white tile, not a brand tint: the accent marks the one action (DESIGN.md
			     rule 1), and the button below is it. -->
			<Empty.Media class="mb-3 size-12 rounded-xl bg-card text-foreground shadow-card">
				<Icon weight={iconWeight} class="size-6" />
			</Empty.Media>
		{/if}
		<Empty.Title class="font-heading text-base font-semibold text-balance [overflow-wrap:anywhere]"
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

	@keyframes -global-t-empty-fade {
		from {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.t-empty) > :global(*) {
			animation-name: t-empty-fade;
			animation-delay: 0s;
		}
	}
</style>
