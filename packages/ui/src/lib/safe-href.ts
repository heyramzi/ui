// WHY: Svelte writes an href into the page as given, and following an <a href="javascript:...">
// (or setting location to one) runs that script in the page's origin, with the viewer's session.
const SCRIPT_SCHEME = /^(?:javascript|vbscript):/i;

/**
 * The href as given, or undefined when following it would run script. App routes, https,
 * mailto and app schemes like descript: pass, so a link a component builds from data stays a link.
 */
export function safeHref(href: string | null | undefined): string | undefined {
  if (!href) return undefined;
  // WHY: the URL parser drops tabs, newlines and leading spaces or control bytes, so " java\tscript:" is javascript:.
  const probe = [...href].filter((c) => c.charCodeAt(0) > 32 && c.charCodeAt(0) !== 127).join("");
  return SCRIPT_SCHEME.test(probe) ? undefined : href;
}
