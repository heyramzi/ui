import { clickable } from "#src/core/passes.js";
import { readPassHash, withPassHash } from "#src/hooks/hash.js";
import type { Pass, ReviewModel } from "#src/core/types.js";

/**
 * The selected pass, kept in `#pass=<id>` so back and forward walk through the passes.
 * Falls back to the first clickable pass when the hash names nothing real.
 */
export function usePass(getModel: () => ReviewModel | null) {
  let hashId = $state(readPassHash(location.hash));
  const list = $derived.by<Pass[]>(() => {
    const model = getModel();
    return model ? clickable(model) : [];
  });
  const selected = $derived(list.find((pass) => pass.id === hashId) ?? list[0]);

  const sync = () => (hashId = readPassHash(location.hash));

  $effect(() => {
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  });

  // WHY: replace, not push, so the fallback doesn't add a history entry Back would have to skip.
  $effect(() => {
    if (!selected || hashId === selected.id) return;
    history.replaceState(history.state, "", withPassHash(location.hash, selected.id));
    hashId = selected.id;
  });

  function select(id: string): void {
    if (id === selected?.id || !list.some((pass) => pass.id === id)) return;
    history.pushState(history.state, "", withPassHash(location.hash, id));
    hashId = id;
  }

  return {
    get list() {
      return list;
    },
    get selected() {
      return selected;
    },
    select,
    /** Move by `delta` along the clickable passes, without wrapping. */
    move(delta: number): Pass | undefined {
      const at = list.findIndex((pass) => pass.id === selected?.id);
      const target = list[Math.min(Math.max(at + delta, 0), list.length - 1)];
      if (target) select(target.id);
      return target;
    },
    /** 1-based, the number on the rail. */
    jump(n: number): Pass | undefined {
      const target = list[n - 1];
      if (target) select(target.id);
      return target;
    },
  };
}

export type PassNav = ReturnType<typeof usePass>;
