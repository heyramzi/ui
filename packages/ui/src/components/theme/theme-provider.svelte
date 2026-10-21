<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { ModeWatcher, userPrefersMode } from "mode-watcher";
	import type { ComponentProps } from "svelte";

	// =========================
	// TYPES
	// =========================
	type WatcherProps = ComponentProps<typeof ModeWatcher>;
	// mode-watcher exports its store class under the name UserPrefersMode, so the value type comes from the store.
	type ThemeMode = (typeof userPrefersMode)["current"];

	interface Props extends Omit<WatcherProps, "defaultMode"> {
		/**
		 * The choice the server already knows, for a browser that has none stored. A stored
		 * choice wins, so it seeds a first visit and never overrides a click.
		 */
		initial?: ThemeMode;
		/**
		 * Fires when the person changes the mode, never on load. An app that saves the choice
		 * on its server posts it here.
		 */
		onChange?: (mode: ThemeMode) => void;
	}

	// =========================
	// PROPS
	// =========================
	let { initial = "system", onChange, synchronousModeChanges = true, ...watcher }: Props = $props();

	// =========================
	// EFFECTS
	// =========================
	// The first run is the mode read from storage on mount, which nobody chose.
	let seen: ThemeMode | null = null;
	$effect(() => {
		const next = userPrefersMode.current;
		if (seen !== null && next !== seen) onChange?.(next);
		seen = next;
	});
</script>

<!-- WHY it renders ModeWatcher and nothing else: its inline head script sets the class and
     colour-scheme before the first paint, so there is no flash and no cookie to read.
     WHY synchronous: `revealTheme` snapshots the page the moment its callback returns, so the
     class has to be on the root by then. -->
<ModeWatcher defaultMode={initial} {synchronousModeChanges} {...watcher} />
