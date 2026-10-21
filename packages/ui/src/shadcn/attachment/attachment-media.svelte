<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	export const attachmentMediaVariants = tv({
		base: "cn-attachment-media relative flex aspect-square shrink-0 items-center justify-center overflow-hidden group-data-[state=error]/attachment:bg-destructive/10 group-data-[state=error]/attachment:text-destructive [&_svg]:pointer-events-none bg-muted text-foreground w-10 rounded-lg group-data-[size=sm]/attachment:w-8 group-data-[size=xs]/attachment:w-7 group-data-[size=xs]/attachment:rounded-md [&_svg:not([class*='size-'])]:size-4 group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:size-3.5 group-data-[orientation=vertical]/attachment:w-full group-data-[orientation=vertical]/attachment:[&_svg:not([class*='size-'])]:size-6 group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-6!",
		variants: {
			variant: {
				icon: "cn-attachment-media-variant-icon",
				image:
					"cn-attachment-media-variant-image *:[img]:aspect-square *:[img]:w-full *:[img]:object-cover opacity-60 group-data-[state=idle]/attachment:opacity-100 group-data-[state=done]/attachment:opacity-100",
			},
		},
		defaultVariants: {
			variant: "icon",
		},
	});

	export type AttachmentMediaVariant = VariantProps<typeof attachmentMediaVariants>["variant"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "#src/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		variant = "icon",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		variant?: AttachmentMediaVariant;
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="attachment-media"
	data-variant={variant}
	class={cn(attachmentMediaVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</div>
