import { untrack } from "svelte";

/**
 * One registry for every shortcut, so the keyboard menu can't list a key that does nothing.
 */
export type Binding = {
  id: string;
  /** Normalised combos, e.g. "j", "mod+enter", "arrowdown", "?". */
  keys: string[];
  label: string;
  group: string;
  /** What the menu shows when it differs from the keys, e.g. "1-9". */
  display?: string;
  /** Runs while a text field has focus too. */
  inInput?: boolean;
  enabled?: () => boolean;
  /** Return false to let the key through. */
  run: (event: KeyboardEvent, combo: string) => void | false;
};

export function comboOf(
  event: Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey">,
): string {
  const key =
    event.altKey && event.code.startsWith("Key")
      ? event.code.slice(3).toLowerCase()
      : event.key.toLowerCase();
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push("mod");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey && key.length > 1) parts.push("shift");
  parts.push(key === " " ? "space" : key);
  return parts.join("+");
}

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName));

const WORDS: Record<string, string> = {
  arrowup: "Up",
  arrowdown: "Down",
  arrowleft: "Left",
  arrowright: "Right",
  enter: "Enter",
  escape: "Esc",
  space: "Space",
  mod: "Ctrl",
  alt: "Alt",
  shift: "Shift",
};

/** The words on a keycap: "Up", "Enter", "J". */
export const keycaps = (combo: string): string[] =>
  (combo === "+" ? ["+"] : combo.split("+")).map(
    (part) => WORDS[part] ?? (part.length === 1 ? part.toUpperCase() : part),
  );

export function useKeys(root: () => HTMLElement | null) {
  let bindings = $state.raw<Binding[]>([]);

  function bind(binding: Binding): () => void {
    // WHY: registering runs inside a component's effect, and reading the list there would make every registration re-run every other.
    untrack(() => (bindings = [...bindings, binding]));
    return () => untrack(() => (bindings = bindings.filter((item) => item !== binding)));
  }

  function onKey(event: KeyboardEvent) {
    if (event.defaultPrevented || event.isComposing) return;
    const host = root();
    const target = event.target;
    const inside = target instanceof Node && !!host?.contains(target);
    // WHY: on the bare page the body has focus. Inside another widget of the host page, we stay out.
    if (!inside && target !== document.body && target !== document.documentElement) return;
    const combo = comboOf(event);
    const typing = isTyping(target);
    for (const binding of bindings.toReversed()) {
      if (!binding.keys.includes(combo)) continue;
      if (typing && !binding.inInput) continue;
      if (binding.enabled && !binding.enabled()) continue;
      if (binding.run(event, combo) === false) continue;
      event.preventDefault();
      return;
    }
  }

  $effect(() => {
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  return {
    bind,
    /** The bindings that are live right now, grouped, in the order they registered. */
    get groups() {
      const live = bindings.filter((binding) => !binding.enabled || binding.enabled());
      const out: { group: string; items: Binding[] }[] = [];
      for (const binding of live) {
        const entry = out.find((item) => item.group === binding.group);
        if (entry) entry.items.push(binding);
        else out.push({ group: binding.group, items: [binding] });
      }
      return out;
    },
  };
}

export type Keys = ReturnType<typeof useKeys>;
