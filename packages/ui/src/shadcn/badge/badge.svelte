<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "h-5 gap-1 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive group/badge inline-flex w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap transition-[background-color,border-color,color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none",
		variants: {
			// Three weights a label can carry: filled, tinted, outlined. Severity is the
			// `tone` prop, which reads `TONE_CLASS`, not a variant.
			variant: {
				default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
				secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
				outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
				// For a consumer that wants one "this is wrong" badge without a tone prop.
				destructive: "bg-destructive/10 text-destructive-ink [a]:hover:bg-destructive/20",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@heyramzi/utils";
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
