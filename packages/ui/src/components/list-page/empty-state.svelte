<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import { Button } from "#src/shadcn/button/index.js";
	import * as Empty from "#src/shadcn/empty/index.js";
	import { cn } from "#src/lib/utils.js";
	import type { PhosphorIcon, IconWeight } from "#src/lib/icon-types.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		icon?: PhosphorIcon;
		iconWeight?: IconWeight;
		/** Replaces the muted colour of a bare icon. Ignored by the tile, which stays foreground. */
		iconClass?: string;
		title: string;
		description?: string;
		actionLabel?: string;
		actionHref?: string;
		onAction?: () => void;
		/** Several ways out, drawn in one row after the single action. */
		actions?: Snippet;
		/** `card` fills the white panel; `dashed` frames a whole dashboard section. */
		surface?: "plain" | "card" | "dashed";
		/** `sm` fits a 280px rail: a bare icon and one line of small type. */
		size?: "default" | "sm";
		class?: string;
	}

	/** A null `icon` draws the icon in a white tile. */
	type Look = {
		root: string;
		icon: string | null;
		header: string;
		title: string;
		description: string;
	};

	// =========================
	// PROPS
	// =========================
	let {
		icon: Icon,
		iconWeight,
		iconClass,
		title,
		description,
		actionLabel,
		actionHref,
		onAction,
		actions,
		surface = "plain",
		size = "default",
		class: className,
	}: Props = $props();

	// =========================
	// CONSTANTS
	// =========================
	// A white tile, not a brand tint: the accent marks the one action (DESIGN.md rule 1).
	const PAGE: Look = {
		root: "py-16",
		icon: null,
		header: "max-w-md",
		title: "font-heading text-base font-semibold text-balance [overflow-wrap:anywhere]",
		description: "",
	};

	const RAIL: Look = {
		root: "gap-2 px-6 py-12",
		icon: "size-6",
		header: "max-w-none",
		title: "",
		description: "max-w-56 text-xs leading-relaxed",
	};

	// A dashed box stands in for a whole dashboard section, so it takes a heading's size.
	const SECTION: Look = {
		root: "p-10 text-wrap",
		icon: "size-10",
		header: "max-w-md gap-1.5",
		title: "font-heading text-lg font-semibold tracking-normal",
		description: "text-sm",
	};

	// A framed box sizes as a block, so a caller's `m-4` insets it instead of pushing it 32px wide.
	const SURFACE: Record<NonNullable<Props["surface"]>, string> = {
		plain: "",
		card: "w-auto flex-initial bg-card",
		dashed: "w-auto flex-initial border-2 border-border",
	};

	// =========================
	// DERIVED
	// =========================
	let look = $derived(size === "sm" ? RAIL : surface === "dashed" ? SECTION : PAGE);
	// Dashboard empties carry their own `t-enter`, and a rail empty flips on every filter keystroke.
	let reveal = $derived(look === PAGE);
	let heading = $derived(look === SECTION);
	let hasAction = $derived(Boolean(actionLabel && (actionHref || onAction)));
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- transitions-dev texts reveal: the parts arrive in reading order, so the page reads as
     loaded and empty. Reduced motion keeps the fade. -->
<Empty.Root class={cn(reveal && "t-empty", look.root, SURFACE[surface], className)}>
	{#if Icon && look.icon}
		<Icon
			weight={iconWeight}
			class={cn(look.icon, iconClass ?? "text-muted-foreground")}
			aria-hidden="true"
		/>
	{/if}
	<Empty.Header class={look.header}>
		{#if Icon && !look.icon}
			<Empty.Media class="mb-3 size-12 rounded-xl bg-card text-foreground shadow-card">
				<Icon weight={iconWeight} class="size-6" />
			</Empty.Media>
		{/if}
		<Empty.Title
			class={look.title}
			role={heading ? "heading" : undefined}
			aria-level={heading ? 2 : undefined}>{title}</Empty.Title
		>
		{#if description}
			<Empty.Description class={look.description}>{description}</Empty.Description>
		{/if}
	</Empty.Header>
	{#if hasAction || actions}
		<Empty.Content class="max-w-md flex-row flex-wrap justify-center gap-2">
			{#if hasAction && actionHref}
				<Button href={actionHref}>{actionLabel}</Button>
			{:else if hasAction}
				<Button onclick={onAction}>{actionLabel}</Button>
			{/if}
			{@render actions?.()}
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
