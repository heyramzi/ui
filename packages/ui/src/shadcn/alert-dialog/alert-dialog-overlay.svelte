<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import { cn } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: AlertDialogPrimitive.OverlayProps = $props();
</script>

<AlertDialogPrimitive.Overlay
	bind:ref
	data-slot="alert-dialog-overlay"
	class={cn("t-modal-backdrop fixed inset-0 z-50 bg-black/50", className)}
	{...restProps}
/>
