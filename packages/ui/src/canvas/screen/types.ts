// The Screen card's data shape: a stack of kit parts drawn as a wireframe or a mockup.

export const SCREEN_NODE = "screen";

/** Card width before anyone resizes it. The height follows the parts. */
export const SCREEN_WIDTH = 320;

export const PART_KINDS = ["header", "button", "input", "image", "list", "modal"] as const;
export type PartKind = (typeof PART_KINDS)[number];

export const SCREEN_MODES = ["wireframe", "mockup"] as const;
export type ScreenMode = (typeof SCREEN_MODES)[number];

/** A board holds screens of a handful of parts. One past this is a paste from a file. */
export const MAX_PARTS = 24;
export const MAX_LIST_ITEMS = 12;
export const MAX_LABEL = 120;

export type ScreenPart = {
  /** Stable inside one screen, so a keyed list and an undo step find the same part. */
  id: string;
  kind: PartKind;
  /** The part's words: a header's title, a button's text, an input's label, an image's caption. */
  label: string;
  /** A list's rows. */
  items?: string[];
  /** A modal's body line. */
  text?: string;
  /** A button is the page's main action or a quieter one. */
  variant?: "primary" | "secondary";
};

export type ScreenData = {
  label: string;
  mode: ScreenMode;
  parts: ScreenPart[];
};

/** What a new part of each kind starts with. Words are labels, never sentences. */
export const PART_DEFAULTS: Record<PartKind, Omit<ScreenPart, "id" | "kind">> = {
  header: { label: "Title" },
  button: { label: "Button", variant: "primary" },
  input: { label: "Label" },
  image: { label: "Image" },
  list: { label: "List", items: ["Item", "Item", "Item"] },
  modal: { label: "Title", text: "Text" },
};
