<script lang="ts" module>
	import { alertVariants, type AlertVariant } from "#src/shadcn/alert/alert-variants.js";

	export { alertVariants, type AlertVariant };
</script>

<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		// A caller whose message isn't urgent passes `status`, so a screen reader doesn't interrupt.
		role = "alert",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		variant?: AlertVariant;
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="alert"
	class={cn(alertVariants({ variant }), className)}
	{...restProps}
	{role}
>
	{@render children?.()}
</div>
