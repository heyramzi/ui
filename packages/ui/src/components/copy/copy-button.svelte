<script lang="ts" module>
	import type { HTMLButtonAttributes } from "svelte/elements";

	// Exported so a wrapper's published declaration can name it (scripts/svelte-dts.mjs).
	export interface CopyButtonProps extends Omit<
		HTMLButtonAttributes,
		"value" | "onclick" | "children"
	> {
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
</script>

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
	import { copyText } from "#src/components/copy/clipboard.js";

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
	}: CopyButtonProps = $props();

	// =========================
	// STATE
	// =========================
	let copied = $state(false);
	let resetAt: ReturnType<typeof setTimeout> | undefined;

	// =========================
	// DERIVED
	// =========================
	const inline = $derived(text !== undefined && variant === "inline");
	// A chip's name holds the text it shows (WCAG 2.5.3, label in name), so a
	// speech user who says "click acme-4821" reaches it.
	const restingName = $derived(
		text === undefined || label.toLowerCase().includes(text.toLowerCase())
			? label
			: `${label} ${text}`,
	);

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
	aria-label={announce === "name" && copied ? copiedLabel : restingName}
	class={cn(
		"group/copy t-press shrink-0 outline-none focus-visible:shadow-(--ring-focus)",
		text === undefined
			? size === "sm"
				? "grid size-5 place-items-center rounded-sm transition-colors duration-quick ease-smooth-out hover:bg-foreground/6 motion-reduce:transition-none"
				: buttonVariants({
						variant: variant === "outline" ? "outline" : "ghost",
						size: size === "md" ? "sm" : "default",
						icon: true,
					})
			: inline
				? "inline-flex cursor-copy items-baseline gap-1.5 transition-colors duration-quick ease-smooth-out hover:text-foreground motion-reduce:transition-none"
				: "flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-xs tabular-nums text-muted-foreground transition-colors duration-quick ease-smooth-out hover:bg-foreground/6 hover:text-foreground motion-reduce:transition-none",
		className,
	)}
>
	<!-- One slot, two glyphs, per the transitions-dev icon-swap: the check
	     grows in from half size, the copy glyph only fades. Reduced motion keeps the fade. -->
	<span
		class={cn(
			"relative grid place-items-center",
			text === undefined && size !== "sm" ? "size-4" : "size-3",
			inline &&
				"order-last self-center opacity-60 transition-opacity duration-quick ease-smooth-out group-hover/copy:opacity-100",
		)}
	>
		<Check
			class={cn(
				"col-start-1 row-start-1 size-full transition-[opacity,transform] duration-fast ease-smooth-out motion-reduce:transition-opacity",
				inline ? "text-current" : "text-success-800 dark:text-success-400",
				copied ? "scale-100 opacity-100" : "scale-50 opacity-0 motion-reduce:scale-100",
			)}
			weight="bold"
			aria-hidden="true"
		/>
		{#if agent}
			<StarFour
				class={cn(
					"col-start-1 row-start-1 size-full text-brand/70 transition-[opacity,color] duration-fast ease-smooth-out motion-reduce:transition-opacity group-hover/copy:text-brand",
					copied ? "opacity-0" : "opacity-100",
				)}
				weight="bold"
				aria-hidden="true"
			/>
		{:else}
			<Copy
				class={cn(
					"col-start-1 row-start-1 size-full transition-[opacity,color] duration-fast ease-smooth-out motion-reduce:transition-opacity",
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
