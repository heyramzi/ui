<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import SectionLabel from "#src/components/list-page/section-label.svelte";
import { cn } from "@heyramzi/utils";
import { panelHeaderClass, panelShellClass } from "#src/lib/panel.js";
import type { PhosphorIcon } from "#src/lib/icon-types.js";

// =========================
// TYPES
// =========================
type Props = {
	// One panel per idea in a detail pane. Hand-rolled copies drifted between
	// 8px and 12px corners, so rounded-xl lives here once.
	label?: string;
	labelIcon?: PhosphorIcon;
	// A mark the icon set does not carry (a platform logo), drawn ahead of the
	// label at the same optical size.
	labelLead?: Snippet;
	// The right side of the header bar: a count, a hint, a button cluster.
	actions?: Snippet;
	// WHY: a panel whose body is a media grid or a full-bleed list supplies its
	// own padding, so the shell must be able to step out of the way.
	pad?: boolean;
	// Takes the height the panels above it did not use, inside a `fill` stack.
	// One panel per stack, and it is the one the reader works in.
	grow?: boolean;
	children: Snippet;
	class?: string;
	bodyClass?: string;
};

// =========================
// PROPS
// =========================
let {
	label,
	labelIcon,
	labelLead,
	actions,
	pad = true,
	grow = false,
	children,
	class: className,
	bodyClass,
}: Props = $props();

// =========================
// DERIVED
// =========================
let hasHeader = $derived(Boolean(label || labelLead || actions));
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<section
	class={cn(
		panelShellClass,
		grow && "flex min-h-0 flex-1 flex-col",
		className,
	)}
>
	{#if hasHeader}
		<div
			class={panelHeaderClass}
		>
			{#if label || labelLead}
				<SectionLabel icon={labelIcon}>
					{#if labelLead}
						{@render labelLead()}
					{/if}
					{label}
				</SectionLabel>
			{:else}
				<span></span>
			{/if}
			{#if actions}
				<div class="flex min-w-0 flex-wrap items-center justify-end gap-2">
					{@render actions()}
				</div>
			{/if}
		</div>
	{/if}
	<div class={cn(pad && "p-4", grow && "flex min-h-0 flex-1 flex-col", bodyClass)}>
		{@render children()}
	</div>
</section>
