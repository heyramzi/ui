// One character of context, the slash, and a query of up to 20.
export const SLASH_WINDOW = 22;

/**
 * The slash command typed just before the caret, or null when there isn't one. The slash has to
 * start the text or follow whitespace, so `TCP/IP` and `and/or` stay plain text.
 */
export function slashQueryAt(textBefore: string): string | null {
  const match = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9 ]{0,20})$/);
  return match ? match[1] : null;
}
