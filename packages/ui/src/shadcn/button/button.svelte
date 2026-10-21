<script lang="ts" module>
	import { cn, type WithElementRef } from "#src/lib/utils.js";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { type VariantProps, tv } from "tailwind-variants";

	export const buttonVariants = tv({
		base: "t-press focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-lg border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-3 aria-invalid:ring-3 [&_svg:not([class*='size-'])]:size-4 group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		variants: {
			// Five roles: fill, outline, ghost, destructive, and dashed for an empty
			// slot. `secondary` and `link` went on 4 Sep 2026, one real caller between
			// them.
			variant: {
				default:
					"bg-primary text-primary-foreground shadow-key hover:bg-primary/90 active:shadow-none [a]:hover:bg-primary/80",
				outline:
					"border-border bg-background shadow-btn hover:bg-muted hover:text-foreground active:shadow-none dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground",
				ghost:
					"hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground",
				destructive:
					"bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive dark:text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30",
				// Quiet text that opens an editor or a menu: a ghost that wraps to as many lines as its
				// label needs, aligned left, never a fixed-height square.
				text: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground",
				// WHY a variant and not a class every call site writes: "add another

				// row", "add a step", "attach a call" is one affordance, and it was hand-drawn eleven times across the app with four radii, three text sizes and three different hover hues.

				// A dashed edge says the slot is empty and the click fills it; nothing else in the set says that.
				dashed:
					"border-dashed border-border text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/40 hover:text-foreground",
			},
			// Three heights; a square button is one of them with `icon` set. Eight
			// until 4 Sep 2026: `icon-lg` had no caller, `xs` drew 24px into a 28px
			// row.

			// WHY: every height is authored for a mouse. Under a thumb, Apple's floor is 44px, so each size grows wherever a coarse pointer exists.

			// WHY sm carries a hit area: 28px is under the 32px desktop floor and the 40px coarse height is under 44. The ::after box stays the same 32px (44 on coarse) square whatever the visual size, so a dense toolbar keeps its look.

			// Icon buttons grow both axes because they have no label to widen them. any-pointer, not pointer: see the note in tokens/base.css.
			size: {
				sm: "relative after:absolute after:top-1/2 after:left-1/2 after:h-[max(100%,2rem)] after:w-[max(100%,2rem)] after:-translate-x-1/2 after:-translate-y-1/2 any-pointer-coarse:after:h-[max(100%,2.75rem)] any-pointer-coarse:after:w-[max(100%,2.75rem)] h-7 gap-1 px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5 any-pointer-coarse:h-10 any-pointer-coarse:px-3",
				default:
					"h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 any-pointer-coarse:h-11 any-pointer-coarse:px-3.5",
				lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 any-pointer-coarse:h-11 any-pointer-coarse:px-3.5",
			},
			/** A glyph with no label: square at the height its size already sets. */
			icon: { true: "", false: "" },
		},
		compoundVariants: [
			// After `size` so its heights lose: a text button is as tall as its lines.
			{
				variant: "text",
				class:
					"h-auto min-h-7 justify-start py-1 text-left whitespace-normal any-pointer-coarse:h-auto any-pointer-coarse:min-h-11",
			},
			{
				size: "sm",
				icon: true,
				class: "size-7 px-0 any-pointer-coarse:size-10 any-pointer-coarse:px-0",
			},
			{
				size: "default",
				icon: true,
				class: "size-8 px-0 any-pointer-coarse:size-11 any-pointer-coarse:px-0",
			},
			{
				size: "lg",
				icon: true,
				class: "size-9 px-0 any-pointer-coarse:size-11 any-pointer-coarse:px-0",
			},
		],
		defaultVariants: {
			variant: "default",
			size: "default",
			icon: false,
		},
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
	export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
			icon?: boolean;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = "default",
		size = "default",
		icon = false,
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size, icon }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size, icon }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
