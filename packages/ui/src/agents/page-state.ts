/* What every avatar on the page shares: the batching shown-gate, so a row of
   them comes in together, the path caches, and one theme watcher. */
import { bakesPending } from './vendor/plastic';

export const SHOW_WITHIN = 4000;
export const waiters = new Map<object, { ready: () => boolean; show: () => void }>();

export function showReady() {
  if (bakesPending()) return;
  for (const w of waiters.values()) if (!w.ready()) return;
  const all = [...waiters.values()];
  waiters.clear();
  for (const w of all) w.show();
}

const pathCache = new Map<string, Path2D>();
export function bodyPath(d: string): Path2D {
  let p = pathCache.get(d);
  if (!p) {
    p = new Path2D(d);
    pathCache.set(d, p);
  }
  return p;
}

const partsCache = new Map<string, Path2D[]>();
export function partPaths(d: string): Path2D[] {
  let p = partsCache.get(d);
  if (!p) {
    p = d
      .split(/(?=M)/)
      .filter((s) => s.trim())
      .map((s) => new Path2D(s));
    partsCache.set(d, p);
  }
  return p;
}

let uidSeq = 0;
export const nextUid = () => `ba-${++uidSeq}`;

/* One observer for the whole page: a `.dark` or `data-theme` flip on
   <html> or <body>, or the OS scheme changing, repaints every auto avatar. */
const themeListeners = new Set<() => void>();
let themeWatch: (() => void) | null = null;
export function onThemeChange(fn: () => void): () => void {
  themeListeners.add(fn);
  if (!themeWatch && typeof MutationObserver === 'function' && typeof document !== 'undefined') {
    const fire = () => {
      for (const l of themeListeners) l();
    };
    const mo = new MutationObserver(fire);
    const opts = { attributes: true, attributeFilter: ['class', 'data-theme'] };
    mo.observe(document.documentElement, opts);
    if (document.body) mo.observe(document.body, opts);
    const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
    mq?.addEventListener('change', fire);
    themeWatch = () => {
      mo.disconnect();
      mq?.removeEventListener('change', fire);
    };
  }
  return () => {
    themeListeners.delete(fn);
    if (themeListeners.size === 0 && themeWatch) {
      themeWatch();
      themeWatch = null;
    }
  };
}
