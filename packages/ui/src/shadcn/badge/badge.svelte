<script lang="ts" module>
	import { badgeVariants, type BadgeVariant } from "#src/shadcn/badge/badge-variants.js";

	export { badgeVariants, type BadgeVariant };
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "#src/lib/utils.js";
	import { TONE_CLASS, type Tone } from "#src/lib/tone.js";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		tone,
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
		/** The severity scale. Draws an outlined chip in the tone's colours and ignores `variant`. */
		tone?: Tone;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant: tone ? "outline" : variant }), tone && TONE_CLASS[tone], className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
