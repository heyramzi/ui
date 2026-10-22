/**
 * The one light and dark system, wrapping mode-watcher. Mount `ThemeProvider` once in the root
 * layout, or the no-flash script never runs.
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
