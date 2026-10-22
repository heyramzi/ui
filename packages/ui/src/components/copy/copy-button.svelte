<script lang="ts">
	/**
	 * The one copy control. No `text` prop draws the icon button; `text` draws the
	 * chip. `agent` marks a payload written for a model.
	 */

	// =========================
	// IMPORTS
	// =========================
	import { Check, Copy, StarFour } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import { buttonVariants } from "#src/shadcn/button/index.js";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { copyText } from "#src/components/copy/clipboard.js";

	// =========================
	// TYPES
	// =========================
	interface Props extends Omit<HTMLButtonAttributes, "value" | "onclick" | "children"> {
		/**
		 * What lands on the clipboard. A function runs on the click, so a long list
		 * doesn't build every prompt up front. It may return a promise.
		 */
		value: string | (() => string | Promise<string>);
		/** Names the thing being copied, for a screen reader and the tooltip. */
		label?: string;
		/** Announced when the write lands; see `announce`. */
		copiedLabel?: string;
		/** The chip's visible text. Its presence is what makes this a chip. */
		text?: string;
		/** Marks the payload as an instruction for an AI rather than a raw string. */
		agent?: boolean;
		/**
		 * `sm` matches `OpenIn`, for the icon row inside a calendar chip. `md` is
		 * the 28px icon `Button`, for a toolbar that sits beside other icon buttons.
		 */
		size?: "default" | "md" | "sm";
		/**
		 * Ghost unless it sits beside an outline button; `inline` is for the chip,
		 * taking the surrounding text's font and colour.
		 */
		variant?: "ghost" | "outline" | "inline";
		/**
		 * `region` announces `copiedLabel` in a live region; `name` swaps the button's
		 * name to it (write it in full), for a page rendering hundreds of these.
		 */
		announce?: "region" | "name";
		/** Runs after a write that landed, for a toast the call site owns. */
		onCopied?: () => void;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		value,
		label = "Copy",
		copiedLabel = "Copied",
		text,
		agent = false,
		size = "default",
		variant = "ghost",
		announce = "region",
		onCopied,
		class: className,
		...restProps
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let copied = $state(false);
	let resetAt: ReturnType<typeof setTimeout> | undefined;

	// =========================
	// DERIVED
	// =========================
	const inline = $derived(text !== undefined && variant === "inline");

	// =========================
	// FUNCTIONS
	// =========================
	async function copy(event: MouseEvent) {
		// Rows and cards are clickable; taking the payload out of one must not also
		// open the record it belongs to.
		event.stopPropagation();
		event.preventDefault();
		const payload = typeof value === "function" ? await value() : value;
		if (!(await copyText(payload))) return;
		copied = true;
		clearTimeout(resetAt);
		resetAt = setTimeout(() => (copied = false), 1400);
		onCopied?.();
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<button
	{...restProps}
	type="button"
	onclick={copy}
	title={label}
	aria-label={announce === "name" && copied ? copiedLabel : label}
	class={cn(
		"group/copy t-press shrink-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
		text === undefined
			? size === "sm"
				? "grid size-5 place-items-center rounded-md hover:bg-accent"
				: buttonVariants({
						variant: variant === "outline" ? "outline" : "ghost",
						size: size === "md" ? "sm" : "default",
						icon: true,
					})
			: inline
				? "inline-flex cursor-copy items-baseline gap-1.5 transition-colors hover:text-foreground"
				: "flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs tabular-nums text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground",
		className,
	)}
>
	<!-- One slot, two glyphs, per the transitions-dev icon-swap: the check
	     arrives on the bounce, the copy glyph leaves without one. -->
	<span
		class={cn(
			"relative grid place-items-center",
			text === undefined && size !== "sm" ? "size-4" : "size-3",
			inline && "order-last self-center opacity-60 transition-opacity group-hover/copy:opacity-100",
		)}
	>
		<Check
			class={cn(
				"col-start-1 row-start-1 size-full transition-[opacity,transform] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]",
				inline ? "text-current" : "text-success-800 dark:text-success-400",
				copied ? "scale-100 opacity-100" : "scale-50 opacity-0",
			)}
			weight="bold"
			aria-hidden="true"
		/>
		{#if agent}
			<StarFour
				class={cn(
					"col-start-1 row-start-1 size-full text-brand/70 transition-[opacity,color] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] group-hover/copy:text-brand",
					copied ? "opacity-0" : "opacity-100",
				)}
				weight="bold"
				aria-hidden="true"
			/>
		{:else}
			<Copy
				class={cn(
					"col-start-1 row-start-1 size-full transition-[opacity,color] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]",
					inline ? "text-current" : "text-muted-foreground group-hover/copy:text-foreground",
					copied ? "opacity-0" : "opacity-100",
				)}
				aria-hidden="true"
			/>
		{/if}
	</span>

	{#if text !== undefined}
		<span>{text}</span>
	{/if}

	<!-- The swap is invisible to a reader who cannot see it. -->
	{#if announce === "region"}
		<span aria-live="polite" class="sr-only">{copied ? copiedLabel : ""}</span>
	{/if}
</button>
