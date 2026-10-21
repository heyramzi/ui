<script lang="ts">
	import { Command as CommandPrimitive, useId } from "bits-ui";
	import { cn } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		heading,
		value,
		...restProps
	}: CommandPrimitive.GroupProps & {
		heading?: string;
	} = $props();
</script>

<CommandPrimitive.Group
	bind:ref
	data-slot="command-group"
	class={cn(
		"text-foreground overflow-hidden px-1 py-1",
		// WHY only titled groups: a heading is what makes a group a section, and a section needs a rule above it.

		// Untitled groups inside a combobox stay seamless, and the ones that want a divider still ask for a Separator.
		heading &&
			"[&:not(:first-child)]:border-border/50 [&:not(:first-child)]:mt-1 [&:not(:first-child)]:border-t [&:not(:first-child)]:pt-1",
		className,
	)}
	value={value ?? heading ?? `----${useId()}`}
	{...restProps}
>
	{#if heading}
		<CommandPrimitive.GroupHeading
			class="text-muted-foreground px-2.5 pt-2.5 pb-1.5 text-xs font-medium tracking-[0.09em] uppercase"
		>
			{heading}
		</CommandPrimitive.GroupHeading>
	{/if}
	<CommandPrimitive.GroupItems {children} />
</CommandPrimitive.Group>
