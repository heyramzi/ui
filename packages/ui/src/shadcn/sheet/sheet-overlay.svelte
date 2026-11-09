<script lang="ts">
	import { Dialog as SheetPrimitive } from "bits-ui";
	import { cn } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: SheetPrimitive.OverlayProps = $props();
</script>

<SheetPrimitive.Overlay
	bind:ref
	data-slot="sheet-overlay"
	class={cn(
		"t-modal-backdrop fixed inset-0 z-50",
		className,
	)}
	{...restProps}
/>
