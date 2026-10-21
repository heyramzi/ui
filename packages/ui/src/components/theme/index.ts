/**
 * The one light and dark system: mode-watcher's store and no-flash script, behind one provider.
 * Mount `ThemeProvider` once in the root layout, flip the mode with `toggleMode` or `setMode`, and
 * read it from `mode.current` or `userPrefersMode.current`. `ThemeToggle` and `revealTheme`
 * draw the control and the wipe.
 */
export { default as ThemeProvider } from "#src/components/theme/theme-provider.svelte";
export { revealTheme } from "#src/lib/theme-transition.js";
export {
  mode,
  resetMode,
  setMode,
  systemPrefersMode,
  toggleMode,
  userPrefersMode,
  type UserPrefersMode,
} from "mode-watcher";
