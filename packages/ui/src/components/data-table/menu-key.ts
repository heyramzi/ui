/**
 * Shift+F10 or the ContextMenu key sends Bits UI's ContextMenu the `contextmenu` event Safari
 * never fires for a key. Preventing the key stops Chrome sending a second one.
 */
export function openMenuFromKey(event: KeyboardEvent): void {
  const menuKey = event.key === "ContextMenu" || (event.shiftKey && event.key === "F10");
  if (!menuKey || event.defaultPrevented) return;
  event.preventDefault();
  const row = event.currentTarget as HTMLElement;
  const box = row.getBoundingClientRect();
  row.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: box.left + 16,
      clientY: box.top + box.height,
    }),
  );
}

/** What a row with a menu tells a screen reader about the keys that open it. */
export const MENU_KEYS = "Shift+F10 ContextMenu";
