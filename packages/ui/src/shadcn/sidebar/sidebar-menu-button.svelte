<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	export const sidebarMenuButtonVariants = tv({
		base: "ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground gap-2 rounded-md p-2 text-left text-sm transition-[width,height,padding,background-color,color] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 data-active:font-medium peer/menu-button group/menu-button flex w-full items-center overflow-hidden outline-hidden disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate",
		variants: {
			variant: {
				default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
				outline:
					"bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
			},
			size: {
				// WHY: 32px is a cursor row. In the mobile drawer these are the
				// app's primary navigation targets and need a thumb-sized box.
				default: "h-8 text-sm any-pointer-coarse:h-11",
				sm: "h-7 text-xs any-pointer-coarse:h-10",
				lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type SidebarMenuButtonVariant = VariantProps<typeof sidebarMenuButtonVariants>["variant"];
	export type SidebarMenuButtonSize = VariantProps<typeof sidebarMenuButtonVariants>["size"];
</script>

<script lang="ts">
	import * as Tooltip from "#src/shadcn/tooltip/index.js";
	import { cn, type WithElementRef, type WithoutChildrenOrChild } from "#src/lib/utils.js";
	import { mergeProps } from "bits-ui";
	import type { ComponentProps, Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { useSidebar } from "#src/shadcn/sidebar/context.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		variant = "default",
		size = "default",
		isActive = false,
		tooltipContent,
		tooltipContentProps,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
		isActive?: boolean;
		variant?: SidebarMenuButtonVariant;
		size?: SidebarMenuButtonSize;
		tooltipContent?: Snippet | string;
		tooltipContentProps?: WithoutChildrenOrChild<ComponentProps<typeof Tooltip.Content>>;
		child?: Snippet<[{ props: Record<string, unknown> }]>;
	} = $props();

	const sidebar = useSidebar();

	const buttonProps = $derived({
		class: cn(sidebarMenuButtonVariants({ variant, size }), className),
		"data-slot": "sidebar-menu-button",
		"data-sidebar": "menu-button",
		"data-size": size,
		"data-active": isActive,
		...restProps,
	});
</script>

{#snippet Button({ props }: { props?: Record<string, unknown> })}
	{@const mergedProps = mergeProps(buttonProps, props)}
	{#if child}
		{@render child({ props: mergedProps })}
	{:else}
		<button bind:this={ref} {...mergedProps}>
			{@render children?.()}
		</button>
	{/if}
{/snippet}

{#if !tooltipContent}
	{@render Button({})}
{:else}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				{@render Button({ props })}
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content
			side="right"
			align="center"
			hidden={sidebar.state !== "collapsed" || sidebar.isMobile}
			{...tooltipContentProps}
		>
			{#if typeof tooltipContent === "string"}
				{tooltipContent}
			{:else if tooltipContent}
				{@render tooltipContent()}
			{/if}
		</Tooltip.Content>
	</Tooltip.Root>
{/if}
