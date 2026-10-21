// The card's small drawings, as files a CSS mask paints in the current colour.

import header from "#src/canvas/screen/glyphs/header.svg";
import button from "#src/canvas/screen/glyphs/button.svg";
import input from "#src/canvas/screen/glyphs/input.svg";
import image from "#src/canvas/screen/glyphs/image.svg";
import list from "#src/canvas/screen/glyphs/list.svg";
import modal from "#src/canvas/screen/glyphs/modal.svg";
import up from "#src/canvas/screen/glyphs/up.svg";
import down from "#src/canvas/screen/glyphs/down.svg";
import close from "#src/canvas/screen/glyphs/close.svg";
import plus from "#src/canvas/screen/glyphs/plus.svg";
import hills from "#src/canvas/screen/glyphs/hills.svg";

export type GlyphName =
  | "header"
  | "button"
  | "input"
  | "image"
  | "list"
  | "modal"
  | "up"
  | "down"
  | "close"
  | "plus"
  | "hills";

export const GLYPHS: Record<GlyphName, string> = {
  header,
  button,
  input,
  image,
  list,
  modal,
  up,
  down,
  close,
  plus,
  hills,
};
