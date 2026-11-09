const SAFE_SCHEME = /^(?:https?:|mailto:|tel:)/i;
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
// WHY no SVG: an SVG can carry script, and pasted images are stored as these data: URLs.
const SAFE_IMAGE_DATA = /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,/i;

// WHY: browsers drop tabs, newlines and control bytes from a URL, so "java\tscript:" runs as javascript:.
function clean(raw: string): string {
  return [...raw]
    .filter((c) => c.charCodeAt(0) > 31 && c.charCodeAt(0) !== 127)
    .join("")
    .trim();
}

// The URL when it's safe to put in an href, else null.
export function safeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const href = clean(raw);
  // Relative URLs and same-page anchors carry no scheme, so they are safe.
  if (href.startsWith("#") || href.startsWith("/") || href.startsWith(".")) return href;
  if (SAFE_SCHEME.test(href)) return href;
  if (!ANY_SCHEME.test(href)) return href;
  return null; // javascript:, data:, vbscript:, ...
}

// The URL when it's safe to put in an img src, else null.
export function safeImageUrl(raw: string | null | undefined): string | null {
  const url = safeUrl(raw);
  if (url !== null) return url;
  if (!raw) return null;
  const src = clean(raw);
  return SAFE_IMAGE_DATA.test(src) ? src : null;
}
