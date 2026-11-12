<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import { buttonVariants } from "#src/shadcn/button/index.js";
	import { cn } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		// Inside a form, a bare button submits it: Locameublé's Annuler archived the bien (TSK-2744).
		type = "button",
		...restProps
	}: AlertDialogPrimitive.CancelProps = $props();
</script>

<AlertDialogPrimitive.Cancel
	bind:ref
	data-slot="alert-dialog-cancel"
	{type}
	class={cn(buttonVariants({ variant: "outline" }), className)}
	{...restProps}
/>
