/**
 * A demo stage scrolls sideways when its demo is wider than the page (a table at 390 px). A
 * keyboard user can only scroll a box they can focus, so the stage takes a Tab stop and a name
 * while it overflows, and gives both back when it fits.
 */
export function scrollFocus(node: HTMLElement) {
  const sync = () => {
    if (node.scrollWidth > node.clientWidth) {
      node.tabIndex = 0;
      node.setAttribute("role", "group");
      node.setAttribute("aria-label", "Preview, scrolls sideways");
    } else {
      node.removeAttribute("tabindex");
      node.removeAttribute("role");
      node.removeAttribute("aria-label");
    }
  };
  const observer = new ResizeObserver(sync);
  observer.observe(node);
  if (node.firstElementChild) observer.observe(node.firstElementChild);
  sync();
  return () => observer.disconnect();
}
