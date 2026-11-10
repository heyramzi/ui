<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { tick, type Snippet } from "svelte";
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import * as DropdownMenu from "#src/shadcn/dropdown-menu/index.js";
	import { Funnel as FunnelIcon } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import { Button } from "#src/shadcn/button/index.js";
	import { toolbarTriggerClass } from "#src/components/toolbar/toolbar-trigger.js";
	import { getToolbarDensity } from "#src/components/list-page/toolbar-density.js";
	import CountChip from "#src/components/chip/count-chip.svelte";
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
	// In a list-page toolbar that ran out of room even with its tabs folded,
	// the trigger keeps its icon and count and drops the word. See `ListPageShell`.
	const density = getToolbarDensity();
	let iconOnly = $derived(density?.tight === true);

	// =========================
	// STATE
	// =========================
	let content = $state<HTMLElement | null>(null);

	// =========================
	// HANDLERS
	// =========================
	// Clear unmounts itself, so focus goes back to the menu and the arrows keep working.
	async function clear() {
		onClear?.();
		await tick();
		content?.focus();
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<DropdownMenu.Root bind:open>
	<DropdownMenu.Trigger
		class={toolbarTriggerClass({
			active: isActive,
			className: cn(
				iconOnly && !hasCount && !trailing && "aspect-square justify-center px-0",
				triggerClass,
			),
		})}
		title={iconOnly ? label : undefined}
	>
		<IconComponent aria-hidden="true" class="size-3.5" />
		<!-- Hidden, not dropped: the label stays the trigger's accessible name. -->
		<span class={cn(iconOnly && "sr-only")}>{label}</span>
		{#if trailing}
			{@render trailing()}
		{/if}
		{#if hasCount}
			<CountChip {count} size="sm" tone="brand" class="ml-0.5" />
		{/if}
	</DropdownMenu.Trigger>
	<!-- The popover's surface: rounder, text-sm, sized by `width` and not by the trigger. -->
	<DropdownMenu.Content
		bind:ref={content}
		class={cn("min-w-0 rounded-2xl p-2 text-sm", width, contentClass)}
		{align}
	>
		{@render children()}
		{#if onClear && hasCount}
			<DropdownMenuPrimitive.Item closeOnSelect={false} onSelect={clear}>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="sm"
						class="mt-2 w-full text-xs text-muted-foreground"
					>
						{clearLabel}
					</Button>
				{/snippet}
			</DropdownMenuPrimitive.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
