// The card's own words, each one a label. The package ships English; a host passes its own
// translations to the card and keeps this module out of its bundle's way.

import type { PartKind, ScreenMode } from "#src/canvas/screen/types.js";

export type ScreenLabels = {
  name: string;
  mode: string;
  modes: Record<ScreenMode, string>;
  kinds: Record<PartKind, string>;
  addPart: string;
  moveUp: string;
  moveDown: string;
  remove: string;
  primary: string;
  secondary: string;
  addItem: string;
  removeItem: string;
};

export const DEFAULT_SCREEN_LABELS: ScreenLabels = {
  name: "Screen",
  mode: "Mode",
  modes: { wireframe: "Wireframe", mockup: "Mockup" },
  kinds: {
    header: "Header",
    button: "Button",
    input: "Input",
    image: "Image",
    list: "List",
    modal: "Modal",
  },
  addPart: "Add part",
  moveUp: "Move up",
  moveDown: "Move down",
  remove: "Remove",
  primary: "Primary",
  secondary: "Secondary",
  addItem: "Add item",
  removeItem: "Remove item",
};
