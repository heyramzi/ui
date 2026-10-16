<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/effects/theme-toggle/ThemeToggle.css";
	import { cn } from "@heyramzi/utils";
	import MonitorIcon from "@lucide/svelte/icons/monitor";
	import MoonIcon from "@lucide/svelte/icons/moon";
	import SunIcon from "@lucide/svelte/icons/sun";
	import { revealTheme } from "#src/lib/theme-transition.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** Used when `mode` is absent. */
		isDark?: boolean;
		/** The icon follows the mode: Sun, Moon or Monitor. */
		mode?: "light" | "dark" | "system";
		/** Fires after the wipe has started. The caller flips the theme here. */
		onToggle: (event: MouseEvent) => void;
		variant?: "outline" | "ghost" | "inverted";
		/** Alias for `variant="inverted"`. */
		inverted?: boolean;
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
	<SunIcon class={iconClass(active === "light", "rotate-90")} />
	<MoonIcon class={iconClass(active === "dark", "-rotate-90")} />
	{#if mode}
		<MonitorIcon class={iconClass(active === "system", "rotate-90")} />
	{/if}
	<span class="sr-only">{text}</span>
</button>
