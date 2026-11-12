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
		label = "Toggle Sidebar",
		...restProps
	}: ComponentProps<typeof Button> & {
		onclick?: (e: MouseEvent) => void;
		/** What a screen reader calls the icon-only button, in the app's language. */
		label?: string;
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
	aria-expanded={sidebar.expanded}
	aria-controls={sidebar.id}
	onclick={(e) => {
		onclick?.(e);
		sidebar.toggle();
	}}
	{...restProps}
>
	<SidebarSimple aria-hidden="true" size={16} />
	<span class="sr-only">{label}</span>
</Button>
