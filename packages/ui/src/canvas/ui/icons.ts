// Stroke paths for the tool bar icons, drawn on a 24px grid. One list per icon, one path per entry.

export type IconName =
  | "select"
  | "hand"
  | "pen"
  | "highlighter"
  | "eraser"
  | "text"
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "frame"
  | "shapes"
  | "undo"
  | "redo"
  | "cards"
  | "search"
  | "note"
  | "insert"
  | "connect"
  | "distribute-h"
  | "distribute-v"
  | "minus"
  | "more"
  | "mm-child"
  | "mm-sibling"
  | "mm-line-solid"
  | "mm-line-dashed"
  | "mm-ai"
  | "mm-map"
  | "mm-right"
  | "mm-tree"
  | "mm-curve"
  | "mm-elbow"
  | "mm-straight"
  | "mm-center";

export const ICON_PATHS: Record<IconName, readonly string[]> = {
  select: ["M5 3.5 18.5 10l-5.6 1.9L10.7 17.5z"],
  hand: [
    "M8 13V6.5a1.5 1.5 0 0 1 3 0V11m0-5.5a1.5 1.5 0 0 1 3 0V11m0-4a1.5 1.5 0 0 1 3 0v6.5a6.5 6.5 0 0 1-6.5 6.5h-.4a6 6 0 0 1-4.7-2.3L4.6 14.6a1.5 1.5 0 0 1 2.3-1.9L8 14",
  ],
  pen: ["M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z", "M14.5 6.5l3 3"],
  highlighter: ["M14.5 4.5l5 5-8 8-5 1.5 1-5z", "M4 21h16"],
  eraser: [
    "M4.5 15l8.5-8.5a2.1 2.1 0 0 1 3 0l3 3a2.1 2.1 0 0 1 0 3L12 20H8z",
    "M10.5 9l6 6M12 20h8",
  ],
  text: ["M5 7V5.5h14V7M12 5.5V19M9 19h6"],
  rectangle: ["M6 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"],
  ellipse: ["M4 12a8 6 0 1 0 16 0a8 6 0 1 0-16 0"],
  diamond: ["M12 4l8 8-8 8-8-8z"],
  frame: ["M8 4v16M16 4v16M4 8h16M4 16h16"],
  shapes: [
    "M5 12.5h5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19v-5A1.5 1.5 0 0 1 5 12.5z",
    "M11.5 8a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0",
  ],
  undo: ["M9 14 4 9l5-5M4 9h9.5a6 6 0 0 1 0 12H11"],
  redo: ["M15 14l5-5-5-5M20 9h-9.5a6 6 0 0 0 0 12H13"],
  cards: [
    "M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z",
    "M12 8.5v7M8.5 12h7",
  ],
  search: ["M4.5 11a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0-13 0", "M16 16l4 4"],
  note: [
    "M6 4h12a1 1 0 0 1 1 1v9l-5 5H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z",
    "M19 14h-4a1 1 0 0 0-1 1v4",
  ],
  insert: ["M12 5v14M5 12h14"],
  connect: [
    "M4.5 4.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0",
    "M6 6v4.5a3 3 0 0 0 3 3h9",
    "M15 10.5l3.5 3-3.5 3",
  ],
  "distribute-h": ["M4 4v16M20 4v16", "M9 8h6v8H9z"],
  "distribute-v": ["M4 4h16M4 20h16", "M8 9h8v6H8z"],
  minus: ["M5 12h14"],
  more: [
    "M4.8 12a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0-2.4 0",
    "M10.8 12a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0-2.4 0",
    "M16.8 12a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0-2.4 0",
  ],
  "mm-child": [
    "M4.0 8h3.0a1.5 1.5 0 0 1 1.5 1.5v5.0a1.5 1.5 0 0 1-1.5 1.5h-3.0a1.5 1.5 0 0 1-1.5-1.5v-5.0a1.5 1.5 0 0 1 1.5-1.5z",
    "M8.5 12h3.5",
    "M14 7h5.5a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-5.5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z",
    "M16.75 10v4M14.75 12h4",
  ],
  "mm-sibling": [
    "M4 6h2.5M4 17.5h2.5M4 6v11.5",
    "M8.5 3h7a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z",
    "M8.5 14.5h7a2 2 0 0 1 2 2v2.5a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-2.5a2 2 0 0 1 2-2z",
    "M12 15.75v4M10 17.75h4",
  ],
  "mm-line-solid": [
    "M2.5 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
    "M6.5 12h11",
    "M17.5 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
  ],
  "mm-line-dashed": [
    "M2.5 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
    "M7.5 12h2M11 12h2M14.5 12h2",
    "M17.5 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
  ],
  "mm-ai": [
    "M10.5 5l1.9 5.1L17.5 12l-5.1 1.9L10.5 19l-1.9-5.1L3.5 12l5.1-1.9z",
    "M18.5 3.5v4M16.5 5.5h4",
  ],
  "mm-map": [
    "M9 10h6v4H9z",
    "M9 12C6 12 6 6 3 6M9 12c-3 0-3 6-6 6M15 12c3 0 3-6 6-6M15 12c3 0 3 6 6 6",
  ],
  "mm-right": ["M3 10h6v4H3z", "M9 12c4 0 4-6 8-6h4M9 12c4 0 4 6 8 6h4"],
  "mm-tree": [
    "M9 3h6v4H9z",
    "M12 7v4M5 11h14M5 11v3M19 11v3M12 11v3",
    "M3 14h4v4H3zM10 14h4v4h-4zM17 14h4v4h-4z",
  ],
  "mm-curve": ["M4 18c8 0 8-12 16-12"],
  "mm-elbow": ["M4 18h8V6h8"],
  "mm-straight": ["M4 18 20 6"],
  "mm-center": ["M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8z", "M12 3v3M12 18v3M3 12h3M18 12h3"],
};
