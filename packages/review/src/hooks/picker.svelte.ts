import { insertRef, itemsFor, triggerAt, type Pick, type Trigger } from "#src/core/refs.js";
import type { Library } from "#src/hooks/library.svelte.js";

type Field = HTMLTextAreaElement | HTMLInputElement;

let counter = 0;

/**
 * The @ picker for one text field. Its `keydown` says whether the key was its own.
 */
export function createPicker(library: Library) {
  const id = `rv-picker-${(counter += 1)}`;
  let field = $state.raw<Field | null>(null);
  let trigger = $state.raw<Trigger | null>(null);
  let index = $state(0);
  let tab = $state("all");
  const all = $derived<Pick[]>(trigger ? itemsFor(library.shelves, trigger) : []);
  /** The shelves this search found, so a tab never opens onto nothing. */
  const tabs = $derived([
    ...new Map(all.map((p) => [p.shelf.id, { id: p.shelf.id, label: p.shelf.label }])).values(),
  ]);
  const current = $derived(tabs.some((t) => t.id === tab) ? tab : "all");
  const items = $derived(current === "all" ? all : all.filter((p) => p.shelf.id === current));
  const open = $derived(all.length > 0);

  function show(id: string) {
    tab = id;
    index = 0;
  }

  function close() {
    trigger = null;
    index = 0;
  }

  /** Call after the text or the caret changed. */
  function sync(el: Field) {
    field = el;
    const next = triggerAt(el.value, el.selectionStart ?? el.value.length, library.shelves);
    if (JSON.stringify(next) !== JSON.stringify(trigger)) index = 0;
    trigger = next;
    // WHY: the first @ can arrive before the shelves have, so ask again once they land.
    if (!next && !library.ready && /[@/]/.test(el.value))
      void library.ensure().then(() => field === el && sync(el));
  }

  function pick(at: number) {
    const chosen = items[at];
    if (!field || !trigger || !chosen) return;
    const el = field;
    const caret = el.selectionStart ?? el.value.length;
    const next = insertRef(el.value, trigger, caret, chosen);
    el.value = next.value;
    el.setSelectionRange(next.caret, next.caret);
    close();
    el.focus();
    // WHY: a bound value only hears the input event, not a script setting it.
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  /** True when the key was the picker's, so the field's own Enter and Escape must stand down. */
  function keydown(event: KeyboardEvent): boolean {
    if (!open) return false;
    const count = items.length;
    if (event.key === "ArrowDown" || event.key === "ArrowUp")
      index = (index + (event.key === "ArrowDown" ? 1 : -1) + count) % count;
    else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const ids = ["all", ...tabs.map((t) => t.id)];
      const at = ids.indexOf(current) + (event.key === "ArrowRight" ? 1 : -1);
      show(ids[(at + ids.length) % ids.length] ?? "all");
    } else if ((event.key === "Enter" && !event.shiftKey) || event.key === "Tab") pick(index);
    else if (event.key === "Escape") close();
    else return false;
    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  return {
    id,
    sync,
    pick,
    close,
    keydown,
    show,
    get tabs() {
      return tabs;
    },
    get tab() {
      return current;
    },
    get items() {
      return items;
    },
    get open() {
      return open;
    },
    get index() {
      return index;
    },
    set index(value: number) {
      index = value;
    },
    get attrs() {
      return {
        role: "combobox",
        "aria-autocomplete": "list" as const,
        "aria-expanded": open,
        "aria-controls": id,
        "aria-activedescendant": open ? `${id}-${index}` : undefined,
      };
    },
  };
}

export type Picker = ReturnType<typeof createPicker>;
