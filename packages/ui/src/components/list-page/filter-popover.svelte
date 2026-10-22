<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import * as Popover from "#src/shadcn/popover/index.js";
	import { Funnel as FunnelIcon } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import { Button } from "#src/shadcn/button/index.js";
	import { toolbarTriggerClass } from "#src/components/toolbar/toolbar-trigger.js";
	import type { PhosphorIcon } from "#src/lib/icon-types.js";

	// phosphor-svelte v2 (resolved here) and v3 (what consumers run) differ only in
	// Component generics. The cast bridges that type-only gap.
	const DefaultFunnelIcon = FunnelIcon as unknown as PhosphorIcon;

	// =========================
	// TYPES
	// =========================
	interface Props {
		label: string;
		icon?: PhosphorIcon;
		count?: number;
		active?: boolean;
		onClear?: () => void;
		align?: "start" | "center" | "end";
		width?: `w-${string}`;
		open?: boolean;
		clearLabel?: string;
		triggerClass?: string;
		contentClass?: string;
		children: Snippet;
		trailing?: Snippet;
	}

	// =========================
	// PROPS
	// =========================
	let {
		label,
		icon: IconComponent = DefaultFunnelIcon,
		count = 0,
		active,
		onClear,
		align = "start",
		width = "w-52",
		open = $bindable(false),
		clearLabel = "Clear",
		triggerClass,
		contentClass,
		children,
		trailing,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	let hasCount = $derived(count > 0);
	let isActive = $derived(active ?? hasCount);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<Popover.Root bind:open>
	<Popover.Trigger class={toolbarTriggerClass({ active: isActive, className: triggerClass })}>
		<IconComponent class="size-3.5" />
		<span>{label}</span>
		{#if trailing}
			{@render trailing()}
		{/if}
		{#if hasCount}
			<span
				class="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-brand/15 text-[10px] font-semibold text-brand dark:text-brand-light"
			>
				{count}
			</span>
		{/if}
	</Popover.Trigger>
	<Popover.Content class={cn("p-2", width, contentClass)} {align}>
		{@render children()}
		{#if onClear && hasCount}
			<Button
				variant="ghost"
				size="sm"
				class="mt-2 w-full text-xs text-muted-foreground"
				onclick={onClear}
			>
				{clearLabel}
			</Button>
		{/if}
	</Popover.Content>
</Popover.Root>
