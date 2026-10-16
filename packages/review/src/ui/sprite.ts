import type { IconName } from "#src/core/types.js";

/**
 * One sprite, one 1.75 stroke on a 24 grid. Typed as a record over every IconName, so adding a
 * name to the contract without drawing it stops the build.
 */
export const ICONS: Record<IconName, string> = {
  layout: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9.5 4v16M9.5 12H21"/>',
  motion: '<path d="M13.5 3 5 13.5h6L10 21l8.5-10.5h-6z"/>',
  broll:
    '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7.5 4v16M16.5 4v16M3 9h4.5M3 15h4.5M16.5 9H21M16.5 15H21"/>',
  sound:
    '<path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z"/><path d="M16.5 9a4.2 4.2 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
  music:
    '<path d="M9 18V5.5l11-2V16"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  caption:
    '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M7 11h3.5M7 15h1.5M13 11h4M11.5 15H17"/>',
  zoom: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.9-4.9M10.5 8v5M8 10.5h5"/>',
  note: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  refresh: '<path d="M20 11.5a8 8 0 1 0-2.2 6"/><path d="M20 4.5v7h-7"/>',
  keys: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7.5 14h9"/>',
  plug: '<path d="M9 3v5M15 3v5M6 8h12v3.5a6 6 0 0 1-12 0zM12 17.5V21"/>',
  "panel-left": '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9.5 4v16"/>',
  "panel-right": '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M14.5 4v16"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  pause:
    '<rect x="6.5" y="5" width="3.5" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="3.5" height="14" rx="1" fill="currentColor"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  span: '<path d="M4 12h16M4 8v8M20 8v8"/>',
  frame:
    '<path d="M4 9V6.5A2.5 2.5 0 0 1 6.5 4H9M15 4h2.5A2.5 2.5 0 0 1 20 6.5V9M20 15v2.5a2.5 2.5 0 0 1-2.5 2.5H15M9 20H6.5A2.5 2.5 0 0 1 4 17.5V15"/>',
  quote: '<path d="M10 8H6.5v4.5H10V17H7M18 8h-3.5v4.5H18V17h-3"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10.5 5-3v9l-5-3"/>',
  trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 12.5h9.4L17.5 7"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h9.5a6 6 0 0 1 0 12H11"/>',
  send: '<path d="M4 11.5 20 4l-4.5 16-3.5-6.5z"/><path d="M12 13.5 20 4"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  expand: '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
  "skip-back": '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4.5V9h4.5"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v3.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 4 17.5v-9A2.5 2.5 0 0 1 6.5 6H10"/>',
  "skip-fwd": '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4.5V9h-4.5"/>',
  minus: '<path d="M5 12h14"/>',
  alert: '<path d="M12 4 3 19.5h18z"/><path d="M12 10v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  bot: '<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 4v4M9 13v1.5M15 13v1.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  spark:
    '<path d="M12 3.5c.7 4.7 3.8 7.8 8.5 8.5-4.7.7-7.8 3.8-8.5 8.5-.7-4.7-3.8-7.8-8.5-8.5 4.7-.7 7.8-3.8 8.5-8.5z"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
};

export const SPRITE_ID = "rv-sprite";

/** The sprite as markup: one symbol per icon, `rv-<name>`. */
export const spriteMarkup = (): string =>
  `<svg id="${SPRITE_ID}" xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(
    ICONS,
  )
    .map(([name, body]) => `<symbol id="rv-${name}" viewBox="0 0 24 24">${body}</symbol>`)
    .join("")}</defs></svg>`;

/** Put the sprite in the page once, however many times the UI mounts. */
export function ensureSprite(doc: Document = document): void {
  if (doc.getElementById(SPRITE_ID)) return;
  doc.body.insertAdjacentHTML("afterbegin", spriteMarkup());
}
