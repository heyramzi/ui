// The text a tool bar tooltip shows beside its label, so every button names its key the same way.

const GLYPHS: Record<string, { mac: string; other: string }> = {
  mod: { mac: "⌘", other: "Ctrl" },
  shift: { mac: "⇧", other: "Shift" },
};

export function isMacPlatform(): boolean {
  return typeof navigator !== "undefined" && navigator.platform.includes("Mac");
}

/** "Undo  ⌘Z" on a Mac, "Undo  Ctrl+Z" elsewhere. `keys` are the same words the shortcut list uses. */
export function shortcutTip(label: string, keys: readonly string[], mac = isMacPlatform()): string {
  if (keys.length === 0) return label;
  const parts = keys.map((key) => GLYPHS[key]?.[mac ? "mac" : "other"] ?? key);
  return `${label}  ${parts.join(mac ? "" : "+")}`;
}
