<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { cn } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DialogPrimitive.TitleProps = $props();
</script>

<!-- 16px on a 24px line: the close button centres on that line. -->
<DialogPrimitive.Title
	bind:ref
	data-slot="dialog-title"
	class={cn("text-base leading-6 font-semibold tracking-tight", className)}
	{...restProps}
/>
