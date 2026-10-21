<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "#src/lib/utils.js";
	import { Check } from "phosphor-svelte";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: CommandPrimitive.ItemProps = $props();
</script>

<CommandPrimitive.Item
	bind:ref
	data-slot="command-item"
	class={cn(
		// 32px at 13px inside a 6px inset is the measured density of the product this kit names as its reference (31 Aug 2026).

		// 36px at 14px read as one notch looser on every menu and palette in the app. WHY the keyboard cursor reads as a lit plate rather than a tint: accent

		// at half strength is a two-percent lightness step on the dark surface, so the one row the arrow keys are on was the hardest row to find.

		// A foreground wash plus an inset hairline works in both modes from one rule.
		"group/command-item data-selected:bg-foreground/6 data-selected:ring-foreground/10 data-selected:text-foreground data-selected:*:[svg]:text-foreground relative flex min-h-8 cursor-default items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] outline-hidden transition-colors duration-[var(--duration-fast)] select-none active:translate-y-px data-selected:ring-1 data-selected:ring-inset data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
	<!-- WHY hidden rather than transparent: rendered at zero opacity it still took 16px and the row's `ml-auto` on every list that never sets `data-checked`, -->
	<!-- which is what pulled the palette's right-hand column out of alignment. -->
	<Check
		size={16}
		class="cn-command-item-indicator group-data-[checked=true]/command-item:block ml-auto hidden"
	/>
</CommandPrimitive.Item>
