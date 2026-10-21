<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import { cn } from "#src/lib/utils.js";
import { panelHeaderClass, panelShellClass } from "#src/lib/panel.js";
import { SectionLabel } from "#src/components/list-page/index.js";
import type { PhosphorIcon } from "#src/lib/icon-types.js";

// =========================
// TYPES
// =========================
interface Props {
	/** What this section of the dashboard is. Drawn as the app's one panel label. */
	label: string;
	labelIcon?: PhosphorIcon;
	/**
	 * A row count, total or freshness stamp. It's a prop, not an action,
	 * because hand-placed hints ended up at three type sizes on one screen.
	 */
	hint?: string;
	/** Controls that act on this panel. Pinned right, after the hint. */
	actions?: Snippet;
	/** A line under the label, for the scope a number was measured over. */
	sublabel?: string;
	/** Off for a body that supplies its own padding: a table, a full-bleed list. */
	pad?: boolean;
	/**
	 * The body scrolls sideways rather than squeezing. For a wide table, which is
	 * every table on a dashboard once the window is narrower than its columns.
	 */
	scroll?: boolean;
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
	hint,
	actions,
	sublabel,
	pad = true,
	scroll = false,
	children,
	class: className,
	bodyClass,
}: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<section class={cn(panelShellClass, className)}>
	<div class={panelHeaderClass}>
		<div class="flex min-w-0 flex-col gap-0.5">
			<SectionLabel icon={labelIcon}>{label}</SectionLabel>
			{#if sublabel}
				<span class="truncate text-xs text-muted-foreground">{sublabel}</span>
			{/if}
		</div>
		{#if hint || actions}
			<div class="flex min-w-0 shrink-0 items-center gap-3">
				{#if hint}
					<span class="text-xs tabular-nums text-muted-foreground">{hint}</span>
				{/if}
				{#if actions}
					{@render actions()}
				{/if}
			</div>
		{/if}
	</div>
	<div class={cn(pad && "p-4", scroll && "overflow-x-auto", bodyClass)}>
		{@render children()}
	</div>
</section>
