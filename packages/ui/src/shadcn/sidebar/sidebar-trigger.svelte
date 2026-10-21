<script lang="ts">
	import { Button } from "#src/shadcn/button/index.js";
	import { SidebarSimple } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import type { ComponentProps } from "svelte";
	import { useSidebar } from "#src/shadcn/sidebar/context.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		onclick,
		...restProps
	}: ComponentProps<typeof Button> & {
		onclick?: (e: MouseEvent) => void;
	} = $props();

	const sidebar = useSidebar();
</script>

<Button
	bind:ref
	data-sidebar="trigger"
	data-slot="sidebar-trigger"
	variant="ghost"
	size="sm"
	icon
	class={cn("cn-sidebar-trigger", className)}
	type="button"
	onclick={(e) => {
		onclick?.(e);
		sidebar.toggle();
	}}
	{...restProps}
>
	<SidebarSimple size={16} />
	<span class="sr-only">Toggle Sidebar</span>
</Button>
