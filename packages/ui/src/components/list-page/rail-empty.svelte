<script lang="ts">
// =========================
// IMPORTS
// =========================
import { cn } from "#src/lib/utils.js";
import * as Empty from "#src/shadcn/empty/index.js";
import type { PhosphorIcon, IconWeight } from "#src/lib/icon-types.js";

// =========================
// TYPES
// =========================
interface Props {
	// Not `EmptyState`, which has a 48px icon and an action. This says a filter
	// came back empty, in one sentence that fits a 280px rail.
	icon?: PhosphorIcon;
	iconWeight?: IconWeight;
	iconClass?: string;
	title: string;
	hint?: string;
	class?: string;
}

// =========================
// PROPS
// =========================
let {
	icon: Icon,
	iconWeight,
	iconClass,
	title,
	hint,
	class: className,
}: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<Empty.Root class={cn("h-full gap-2 px-6 py-12", className)}>
	{#if Icon}
		<Icon
			weight={iconWeight}
			class={cn("size-6", iconClass ?? "text-muted-foreground/40")}
			aria-hidden="true"
		/>
	{/if}
	<Empty.Title>{title}</Empty.Title>
	{#if hint}
		<Empty.Description class="max-w-56 text-xs leading-relaxed">{hint}</Empty.Description>
	{/if}
</Empty.Root>
