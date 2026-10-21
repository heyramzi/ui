<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { cn } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DialogPrimitive.OverlayProps = $props();
</script>

<DialogPrimitive.Overlay
	bind:ref
	data-slot="dialog-overlay"
	class={cn(
		"t-modal-backdrop supports-backdrop-filter:backdrop-blur-xs fixed inset-0 isolate z-50",
		className,
	)}
	{...restProps}
/>
