import { html as satoriHtml } from "satori-html";
import { __unsafeHTML } from "ultrahtml";

/**
 * Branded marker for pre-built HTML/SVG markup that must NOT be HTML-escaped when interpolated into an `html` tagged template.
 */

/*
 * Produced by `raw()`. The runtime shape matches ultrahtml's `__unsafeHTML` return value so it flows through satori-html's parser untouched.
 */
export type RawMarkup = { readonly value: string; readonly [RAW_MARKUP]: true };

const RAW_MARKUP: unique symbol = Symbol.for("@heyramzi/marketing/imagegen/RawMarkup");

/**
 * Wrap a string as raw HTML/SVG markup so it bypasses HTML escaping when interpolated into `html\`...\``. Without this, any `<tag>` in an interpolated string becomes `&lt;tag&gt;` text.
 */

/*
 * Use for dynamically-built fragments (lists of `<rect>`, `<radialGradient>`, etc.). Never call with user-supplied content — there is no sanitization.
 */
export function raw(markup: string): RawMarkup {
  const marked = __unsafeHTML(markup) as { value: string };
  Object.defineProperty(marked, RAW_MARKUP, { value: true, enumerable: false });
  return marked as RawMarkup;
}

/**
 * Expression types allowed inside an `html\`...\`` template literal.
 */

/*
 * - `string | number | boolean`: interpolated as escaped text. - `RawMarkup`: interpolated as raw markup (wrap fragment strings with `raw()`). - `null | undefined`: skipped.
 */

/*
 * - Arrays of the above: concatenated.
 */

/*
 * Notably excludes arbitrary objects — this prevents accidentally passing the return value of a nested `html\`...\`` call, which would stringify to `[object Object]` at runtime.
 */
export type HtmlExpression =
  | string
  | number
  | boolean
  | null
  | undefined
  | RawMarkup
  | ReadonlyArray<string | number | boolean | null | undefined | RawMarkup>;

/**
 * Satori-compatible markup object. The exact shape is an internal detail of
 * satori-html; treat it as opaque and pass it to `renderImage`.
 */
export type SatoriNode = ReturnType<typeof satoriHtml>;

/**
 * Typed tagged template for building satori-compatible markup.
 */

/*
 * Rules: - Text interpolations (`${stringVar}`) are HTML-escaped. - Markup interpolations (`${raw(fragment)}`) are inserted verbatim. - Nested `html\`...\`` calls are not supported — compose in a single tag.
 */

/*
 * Example: ```ts const stops = raw(items.map((s) => `<stop offset="${s.offset}"/>`).join("")); return html`<svg><defs><radialGradient>${stops}</radialGradient></defs></svg>`; ```
 */
export function html(strings: TemplateStringsArray, ...values: HtmlExpression[]): SatoriNode {
  const flattened = values.map((value) => {
    if (Array.isArray(value)) {
      const parts = value.map((item) => {
        if (item == null || item === false) return "";
        if (isRawMarkup(item)) return item.value;
        return escapeHtml(String(item));
      });
      return raw(parts.join(""));
    }
    return value;
  });
  return satoriHtml(strings, ...flattened);
}

function isRawMarkup(value: unknown): value is RawMarkup {
  return typeof value === "object" && value !== null && RAW_MARKUP in value;
}

function escapeHtml(input: string): string {
  return input.replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
}
