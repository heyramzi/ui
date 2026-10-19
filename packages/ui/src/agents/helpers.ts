/* Pure helpers for the avatar: numbers, theme, lights, idle scheduling. */
import { stockLights } from './vendor/plastic';

export const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : 1));
export const q = (v: number, lo: number, hi: number) => Math.round(clamp(v, lo, hi) * 20) / 20;
export const clampOpt = (v: number | undefined, d: number, lo: number, hi: number) =>
  clamp(v ?? d, lo, hi);
export const deviceDpr = () =>
  Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);

export function hashSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

export const reducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function resolveTheme(theme: 'auto' | 'dark' | 'light', el: HTMLElement | null): 'dark' | 'light' {
  if (theme !== 'auto') return theme;
  const host = el?.closest('[data-theme], .dark, .light') as HTMLElement | null;
  if (host) {
    const v = host.getAttribute('data-theme');
    if (v === 'dark' || v === 'light') return v;
    if (host.classList.contains('dark')) return 'dark';
    if (host.classList.contains('light')) return 'light';
  }
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

export function lightsFor(lightAt: number, backLight?: number, lightFront?: number) {
  const a = (lightAt * Math.PI) / 180;
  const b = ((backLight ?? 0) * Math.PI) / 180;
  const lights = stockLights(Math.sin(a), -Math.cos(a));
  if (backLight !== undefined) [lights.bx, lights.by] = [Math.sin(b), -Math.cos(b)];
  if (lightFront !== undefined) lights.front = (Math.min(85, Math.max(0, lightFront)) * Math.PI) / 180;
  return lights;
}

export function warmIdle(fn: () => void): () => void {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(fn);
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(fn, 1);
  return () => clearTimeout(id);
}

/* Full pull up close, fading to nothing by 3 head widths. */
export function pointerStrength(d: number) {
  if (d < 1) return 1;
  if (d > 3) return 0;
  return 1 - (d - 1) / 2;
}
