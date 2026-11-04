<script lang="ts" module>
	import {
		toggleVariants,
		type ToggleSize,
		type ToggleVariant,
		type ToggleVariants,
	} from "#src/shadcn/toggle/toggle-variants.js";

	export { toggleVariants, type ToggleSize, type ToggleVariant, type ToggleVariants };
</script>

<script lang="ts">
	import { Toggle as TogglePrimitive } from "bits-ui";
	import { cn } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		pressed = $bindable(false),
		class: className,
		size = "default",
		variant = "default",
		...restProps
	}: TogglePrimitive.RootProps & {
		variant?: ToggleVariant;
		size?: ToggleSize;
	} = $props();
</script>

<TogglePrimitive.Root
	bind:ref
	bind:pressed
	data-slot="toggle"
	class={cn(toggleVariants({ variant, size }), className)}
	{...restProps}
/>
