<script lang="ts">
	import { MessageScroller as MessageScrollerPrimitive } from "@shadcn-svelte/primitives/message-scroller";
	import { ArrowDown } from "phosphor-svelte";
	import { Button } from "#src/shadcn/button/index.js";
	import type { ButtonSize, ButtonVariant } from "#src/shadcn/button/index.js";
	import { cn } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		direction = "end",
		class: className,
		children,
		child: childProp,
		variant = "outline",
		size = "sm",
		onclick,
		label,
		...restProps
	}: MessageScrollerPrimitive.ButtonProps & {
		variant?: ButtonVariant;
		size?: ButtonSize;
		/**
		 * What a screen reader calls the icon-only button, in the app's language.
		 * Defaults to "Scroll to end", or "Scroll to start" when `direction="start"`.
		 */
		label?: string;
	} = $props();

	const srLabel = $derived(label ?? (direction === "end" ? "Scroll to end" : "Scroll to start"));

	// The primitive blurs the button and it turns inert at the end, dropping focus to the page. Focus goes to the thread instead.
	function handleClick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclick?.(event);
		if (event.defaultPrevented) return;
		const viewport = event.currentTarget
			.closest('[data-slot="message-scroller"]')
			?.querySelector<HTMLElement>('[data-slot="message-scroller-viewport"]');
		queueMicrotask(() => viewport?.focus({ preventScroll: true }));
	}
</script>

<MessageScrollerPrimitive.Button
	bind:ref
	data-slot="message-scroller-button"
	data-direction={direction}
	data-variant={variant}
	data-size={size}
	{direction}
	onclick={handleClick}
	class={cn(
		"absolute inset-s-1/2 -translate-x-1/2 border-border bg-card text-foreground transition-[translate,scale,opacity] duration-200 hover:bg-muted hover:text-foreground data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=false]:duration-400 data-[active=false]:ease-[cubic-bezier(0.7,0,0.84,0)] data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[active=true]:ease-[cubic-bezier(0.23,1,0.32,1)] data-[direction=end]:bottom-4 data-[direction=end]:data-[active=false]:translate-y-full data-[direction=start]:top-4 data-[direction=start]:data-[active=false]:-translate-y-full rtl:translate-x-1/2 data-[direction=start]:[&_svg]:rotate-180",
		className
	)}
	{...restProps}
>
	{#snippet child(state)}
		{#if childProp}
			{@render childProp(state)}
		{:else}
			<Button {variant} {size} icon={!children} {...state.props}>
				{#if children}
					{@render children()}
				{:else}
					<ArrowDown aria-hidden="true" />
					<span class="sr-only">{srLabel}</span>
				{/if}
			</Button>
		{/if}
	{/snippet}
</MessageScrollerPrimitive.Button>
