<script lang="ts" module>
	import type { Component } from "svelte";

	/**
	 * The one way out to a tool: mark, name, go-to arrow, never the verb, which
	 * survives as the accessible name.
	 */
	export interface OpenInTool {
		/** The visible text, and the word the tool calls itself. */
		name: string;
		/** The default accessible sentence, when the caller passes no translated one. */
		action: string;
		icon: Component<{ size?: number; class?: string; "aria-hidden"?: boolean | "true" | "false" }>;
	}

	/** `chip` is the bordered inline tag, `button` sits in a header beside other
	 *  buttons. A bare-mark form was cut: at 20px it failed WCAG 2.5.8. */
	export type OpenInVariant = "chip" | "button";
	export type OpenInSize = "sm" | "default";
</script>

<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { ArrowSquareOut } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import { buttonVariants } from "#src/shadcn/button/index.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** The tool to link to: its name, accessible sentence and mark. */
		tool: OpenInTool;
		href: string;
		variant?: OpenInVariant;
		size?: OpenInSize;
		/** Overrides the visible text. The accessible name is `title`, never this. */
		label?: string;
		/** The accessible sentence, translated by the caller. */
		title?: string;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		tool,
		href,
		variant = "chip",
		size = "default",
		label,
		title,
		class: className,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	let Icon = $derived(tool.icon);
	let iconSize = $derived(size === "sm" ? 12 : 14);
	let action = $derived(title ?? tool.action);
	let text = $derived(label ?? tool.name);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- The click stops here because these usually sit in a clickable row, and a
     call site that forgot would open the row as well. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	role="presentation"
	class="inline-flex shrink-0"
	onclick={(e) => e.stopPropagation()}
	onkeydown={(e) => e.stopPropagation()}
>
	<a
		{href}
		target="_blank"
		rel="noopener noreferrer"
		aria-label={action}
		title={action}
		class={cn(
			variant === "button"
				? buttonVariants({ variant: "outline", size: size === "sm" ? "sm" : "default" })
				: cn(
						"inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
						// WHY the button heights: the sm chip was 19px, under the 24px target
						// floor. Under a thumb it grows to 40 and 44, and the sm hit area to 44.
						size === "sm"
							? "relative h-7 px-2 text-2xs after:absolute after:top-1/2 after:left-1/2 after:h-[max(100%,1.5rem)] after:w-[max(100%,1.5rem)] after:-translate-x-1/2 after:-translate-y-1/2 any-pointer-coarse:h-10 any-pointer-coarse:after:h-[max(100%,2.75rem)] any-pointer-coarse:after:w-[max(100%,2.75rem)]"
							: "h-8 px-2.5 text-xs any-pointer-coarse:h-11 any-pointer-coarse:px-3",
					),
			className,
		)}
	>
		<Icon aria-hidden="true" size={iconSize} />
		{text}
		<!-- The one thing the mark can't say: this leaves the app. It stays muted
		     so the eye lands on the tool name first. -->
		<ArrowSquareOut aria-hidden="true" size={iconSize} class="text-muted-foreground" />
	</a>
</div>
