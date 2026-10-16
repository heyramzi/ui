import { tryCatchAsync } from "@heyramzi/utils";

/**
 * The one write to the clipboard. A rejected permission, a missing gesture and
 * an insecure origin get one answer: false. The caller decides what to show.
 */

/** Plain text. Returns false when the browser refused the write. */
export async function copyText(value: string): Promise<boolean> {
  const result = await tryCatchAsync(() => navigator.clipboard.writeText(value));
  return result.ok;
}

/**
 * HTML plus a plain-text twin: Gmail keeps the formatting, Cmd+Shift+V stays
 * readable. Falls back to plain text.
 */
export async function copyRichText(html: string, plainText?: string): Promise<boolean> {
  const text = plainText ?? htmlToPlainText(html);
  const result = await tryCatchAsync(() =>
    navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      }),
    ]),
  );
  return result.ok ? true : copyText(text);
}

/** The plain-text twin of an HTML fragment. */
export function htmlToPlainText(html: string): string {
  if (typeof document === "undefined") {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<li>/gi, "• ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}
