<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/effects/theme-toggle/ThemeToggle.css";
	import { cn } from "@heyramzi/utils";
	import { Monitor, Moon, Sun } from "phosphor-svelte";
	import { revealTheme } from "#src/lib/theme-transition.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** Used when `mode` is absent. */
		isDark?: boolean;
		/** The icon follows the mode: Sun, Moon or Monitor. The slide variant has no third state, so `system` reads as light. */
		mode?: "light" | "dark" | "system";
		/** Fires after the wipe has started. The caller flips the theme here. */
		onToggle: (event: MouseEvent) => void;
		/** `slide` is a pill track with a thumb that moves between a sun and a moon. */
		variant?: "outline" | "ghost" | "inverted" | "slide";
		/** Alias for `variant="inverted"`. */
		inverted?: boolean;
		/** `sm` is 32px tall, `default` is 40px, in every variant. */
		size?: "default" | "sm";
		/** Overrides the aria-label and the screen-reader text. */
		label?: string;
		title?: string;
		/** Apply the change without the circular wipe. */
		skipTransition?: boolean;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		isDark,
		mode,
		onToggle,
		variant = "outline",
		inverted = false,
		size = "sm",
		label,
		title,
		skipTransition = false,
		class: className,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	let active = $derived(mode ?? (isDark ? "dark" : "light"));
	let style = $derived(inverted ? "inverted" : variant);
	let text = $derived(
		label ??
			(mode
				? `Theme: ${mode}`
				: isDark
					? "Switch to light mode"
					: "Switch to dark mode"),
	);

	// =========================
	// FUNCTIONS
	// =========================
	function handleClick(event: MouseEvent) {
		revealTheme(event, () => onToggle(event), { skip: skipTransition });
	}

	function iconClass(show: boolean, tilt: "rotate-90" | "-rotate-90") {
		return `absolute size-4 transition-all duration-300 ${
			show ? "scale-100 rotate-0 opacity-100" : `scale-0 ${tilt} opacity-0`
		}`;
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if style === "slide"}
	<button
		type="button"
		onclick={handleClick}
		aria-label={text}
		{title}
		data-state={active === "dark" ? "dark" : "light"}
		class={cn("theme-toggle-slide", size === "default" && "theme-toggle-slide--lg", className)}
	>
		<span class="theme-toggle-slide__glow" aria-hidden="true"></span>
		<span class="theme-toggle-slide__icon theme-toggle-slide__icon--sun" aria-hidden="true">
			<Sun size={14} weight="fill" />
		</span>
		<span class="theme-toggle-slide__icon theme-toggle-slide__icon--moon" aria-hidden="true">
			<Moon size={14} weight="fill" />
		</span>
		<span class="theme-toggle-slide__thumb" aria-hidden="true">
			<span class="theme-toggle-slide__ring"></span>
			<Sun size={14} weight="fill" class="theme-toggle-slide__mark theme-toggle-slide__mark--sun" />
			<Moon size={14} weight="fill" class="theme-toggle-slide__mark theme-toggle-slide__mark--moon" />
		</span>
		<span class="sr-only">{text}</span>
	</button>
{:else}
	<button
		onclick={handleClick}
		aria-label={text}
		{title}
		class={cn(
			"theme-toggle relative flex cursor-pointer items-center justify-center rounded-lg transition-all duration-300",
			size === "sm" ? "size-8" : "size-10",
			style === "inverted" && "theme-toggle--inverted",
			style === "ghost" && "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
			style === "outline" &&
				"border border-border/60 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground",
			className,
		)}
	>
		<Sun class={iconClass(active === "light", "rotate-90")} />
		<Moon class={iconClass(active === "dark", "-rotate-90")} />
		{#if mode}
			<Monitor class={iconClass(active === "system", "rotate-90")} />
		{/if}
		<span class="sr-only">{text}</span>
	</button>
{/if}
