<script lang="ts" module>
  /* With more than one deck on a page, body-level keys belong to the deck the
     reader last touched, or the last one to mount. */
  let lastDeck: object | null = null;
</script>

<script lang="ts">
  import { onMount, setContext, untrack, type Snippet } from 'svelte';
  import { DECK_KEY, type DeckApi, type DeckTheme, type DeckTransition } from './types';

  type Props = {
    /** Active slide, zero based. Bindable. */
    index?: number;
    /** Active fragment step on the active slide. Bindable. */
    step?: number;
    /** Colour surface. `ink` (default), `paper` or `auto`. */
    theme?: DeckTheme;
    /** How slides enter: `fade` (default), `slide` or `none`. */
    transition?: DeckTransition;
    /** Show the progress bar. */
    progress?: boolean;
    /** Show the previous, next, counter and fullscreen controls. */
    controls?: boolean;
    /** Wrap around at the ends. */
    loop?: boolean;
    /** Accessible name for the deck region. */
    label?: string;
    class?: string;
    style?: string;
    onchange?: (index: number, step: number) => void;
    children?: Snippet;
  };

  let {
    index = $bindable(0),
    step = $bindable(0),
    theme = 'ink',
    transition = 'fade',
    progress = true,
    controls = true,
    loop = false,
    label = 'Slide deck',
    class: className,
    style,
    onchange,
    children,
  }: Props = $props();

  let order = $state<symbol[]>([]);
  const stepGetters = new Map<symbol, () => number>();
  let rootEl = $state<HTMLElement | null>(null);
  const token = {};

  onMount(() => {
    lastDeck = token;
    return () => {
      if (lastDeck === token) lastDeck = null;
    };
  });

  const total = $derived(order.length);
  const currentId = $derived(order[index]);
  const currentSteps = $derived.by(() => {
    const getter = currentId ? stepGetters.get(currentId) : undefined;
    return getter ? getter() : 0;
  });

  /* Registration runs inside a slide's effect, so the read of `order` has to
     stay untracked or the effect would depend on the write and loop. */
  function registerSlide(id: symbol, steps: () => number) {
    untrack(() => {
      order = [...order, id];
      stepGetters.set(id, steps);
    });
    return () => {
      untrack(() => {
        order = order.filter((entry) => entry !== id);
        stepGetters.delete(id);
        if (index > order.length - 1) index = Math.max(0, order.length - 1);
        step = 0;
      });
    };
  }

  export function go(target: number) {
    if (total === 0) return;
    const clamped = Math.min(total - 1, Math.max(0, target));
    index = clamped;
    step = 0;
    onchange?.(index, step);
  }

  export function next() {
    if (step < currentSteps) {
      step += 1;
    } else if (index < total - 1) {
      index += 1;
      step = 0;
    } else if (loop && total > 0) {
      index = 0;
      step = 0;
    } else {
      return;
    }
    onchange?.(index, step);
  }

  export function prev() {
    if (step > 0) {
      step -= 1;
    } else if (index > 0) {
      index -= 1;
      step = currentSteps;
    } else if (loop && total > 0) {
      index = total - 1;
      step = currentSteps;
    } else {
      return;
    }
    onchange?.(index, step);
  }

  const atStart = $derived(index === 0 && step === 0);
  const atEnd = $derived(index === total - 1 && step >= currentSteps);
  const progressValue = $derived.by(() => {
    if (total === 0) return 0;
    const within = currentSteps > 0 ? step / (currentSteps + 1) : 0;
    return Math.min(1, (index + within) / total);
  });

  const api: DeckApi = {
    index: () => index,
    step: () => step,
    total: () => total,
    isActive: (id) => order[index] === id,
    registerSlide,
    next,
    prev,
    go,
  };
  setContext(DECK_KEY, api);

  function tagOf(target: EventTarget | null) {
    return target instanceof HTMLElement ? target.tagName : '';
  }

  function owns(target: EventTarget | null) {
    if (lastDeck === token) return true;
    return !!rootEl && target instanceof Node && rootEl.contains(target);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || !owns(event.target)) return;
    const tag = tagOf(event.target);
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    /* Space and Enter belong to a focused control, not to the deck. */
    if ((event.key === ' ' || event.key === 'Enter') && (tag === 'BUTTON' || tag === 'A')) return;
    switch (event.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        event.preventDefault();
        next();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        event.preventDefault();
        prev();
        break;
      case 'Home':
        event.preventDefault();
        go(0);
        break;
      case 'End':
        event.preventDefault();
        go(total - 1);
        break;
      case 'f':
      case 'F':
        void toggleFullscreen();
        break;
    }
  }

  let swipe: { x: number; y: number } | null = null;
  function handlePointerDown(event: PointerEvent) {
    lastDeck = token;
    if (event.pointerType === 'mouse') return;
    swipe = { x: event.clientX, y: event.clientY };
  }
  function handlePointerUp(event: PointerEvent) {
    if (!swipe) return;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next();
    else prev();
  }

  export async function toggleFullscreen() {
    if (!rootEl) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await rootEl.requestFullscreen();
    } catch {
      /* A browser without the API, or a denied request. Ignore. */
    }
  }

  const rootClass = $derived(['deck', `deck--${theme}`, className].filter(Boolean).join(' '));
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  bind:this={rootEl}
  class={rootClass}
  style={style}
  data-transition={transition}
  role="region"
  aria-roledescription="carousel"
  aria-label={label}
  tabindex="0"
  onfocusin={() => (lastDeck = token)}
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
>
  <div class="deck__bloom" aria-hidden="true"></div>
  <div class="deck__viewport">
    {@render children?.()}
  </div>
  <div class="deck__grain" aria-hidden="true"></div>

  {#if progress}
    <div
      class="deck__progress"
      role="progressbar"
      aria-label="Deck progress"
      aria-valuemin="0"
      aria-valuemax={total}
      aria-valuenow={index + 1}
    >
      <div class="deck__progress-fill" style={`width:${progressValue * 100}%`}></div>
    </div>
  {/if}

  {#if controls}
    <div class="deck__controls">
      <button
        type="button"
        class="deck__button"
        onclick={prev}
        disabled={!loop && atStart}
        aria-label="Previous slide"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <span class="deck__counter" aria-hidden="true">{index + 1} / {total}</span>
      <button
        type="button"
        class="deck__button"
        onclick={next}
        disabled={!loop && atEnd}
        aria-label="Next slide"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button
        type="button"
        class="deck__button"
        onclick={toggleFullscreen}
        aria-label="Toggle fullscreen"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  {/if}
</div>

<style>
  .deck {
    --deck-bg: #0b0b12;
    --deck-fg: #f4f2fa;
    --deck-muted: color-mix(in oklab, var(--deck-fg) 62%, transparent);
    --deck-accent: #e8663d;
    --deck-accent-glow: color-mix(in oklab, var(--deck-accent) 45%, transparent);
    --deck-line: color-mix(in oklab, var(--deck-fg) 14%, transparent);
    --deck-font: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    --deck-font-display: Georgia, 'Times New Roman', serif;
    --deck-pad: clamp(1.5rem, 4.5vw, 4.5rem);
    --deck-radius: 1.25rem;
    --deck-grain: 0.05;
    --deck-bloom: 0.5;

    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    /* Falls back to a 16:9 box when the parent leaves the height open. */
    aspect-ratio: 16 / 9;
    min-height: 0;
    overflow: hidden;
    background: var(--deck-bg);
    color: var(--deck-fg);
    font-family: var(--deck-font);
    outline: none;
    touch-action: pan-y;
    -webkit-tap-highlight-color: transparent;
  }
  .deck:focus-visible {
    outline: 2px solid var(--deck-accent);
    outline-offset: 4px;
  }

  .deck__bloom {
    position: absolute;
    inset: -10%;
    z-index: 0;
    pointer-events: none;
    background: radial-gradient(60% 60% at 100% 0%, var(--deck-accent-glow), transparent 70%);
    opacity: var(--deck-bloom);
    mix-blend-mode: screen;
  }

  .deck__viewport {
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  .deck__grain {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    opacity: var(--deck-grain);
    mix-blend-mode: screen;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 140px 140px;
  }

  .deck__progress {
    position: absolute;
    right: var(--deck-pad);
    bottom: 1.5rem;
    left: var(--deck-pad);
    z-index: 4;
    height: 2px;
    overflow: hidden;
    background: var(--deck-line);
    border-radius: 999px;
  }
  .deck__progress-fill {
    height: 100%;
    background: var(--deck-accent);
    border-radius: inherit;
    transition: width 0.35s ease;
  }

  .deck__controls {
    position: absolute;
    right: var(--deck-pad);
    bottom: 2.25rem;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    opacity: 0.65;
    transition: opacity 0.2s ease;
  }
  .deck__controls:hover,
  .deck__controls:focus-within {
    opacity: 1;
  }
  .deck__button {
    display: grid;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    color: var(--deck-fg);
    background: color-mix(in oklab, var(--deck-fg) 8%, transparent);
    border: 1px solid var(--deck-line);
    border-radius: 999px;
    cursor: pointer;
    transition:
      background 0.15s ease,
      opacity 0.15s ease;
  }
  .deck__button:hover:not(:disabled) {
    background: color-mix(in oklab, var(--deck-fg) 16%, transparent);
  }
  .deck__button:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .deck__button:focus-visible {
    outline: 2px solid var(--deck-accent);
    outline-offset: 2px;
  }
  .deck__counter {
    min-width: 3.5rem;
    font-size: 0.8125rem;
    font-variant-numeric: tabular-nums;
    text-align: center;
    color: var(--deck-muted);
  }

  /* Slide transitions, keyed off the deck so one prop switches every slide. */
  .deck[data-transition='slide'] :global(.slide) {
    transform: translateX(4%);
  }
  .deck[data-transition='slide'] :global(.slide[data-active='true']) {
    transform: none;
  }
  .deck[data-transition='none'] :global(.slide) {
    transition: none;
  }

  /* Authored type. Users write these classes inside a Slide. */
  .deck :global(.deck-eyebrow) {
    margin: 0 0 1.25rem;
    font-size: clamp(0.75rem, 1.5vw, 0.9375rem);
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--deck-accent);
  }
  .deck :global(.deck-title) {
    margin: 0;
    font-size: clamp(2.25rem, 7vw, 5.5rem);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.03em;
    text-transform: uppercase;
    color: var(--deck-fg);
    text-wrap: balance;
  }
  .deck :global(.deck-named) {
    display: block;
    margin-top: 0.35em;
    font-family: var(--deck-font-display);
    font-style: italic;
    font-weight: 700;
    font-size: clamp(1.75rem, 6vw, 4.5rem);
    line-height: 1.02;
    color: var(--deck-accent);
    text-shadow: 0 0 2.5rem var(--deck-accent-glow);
  }
  .deck :global(.deck-body) {
    max-width: 44rem;
    margin: 1.5rem auto 0;
    font-size: clamp(1rem, 2.1vw, 1.6rem);
    line-height: 1.45;
    color: var(--deck-muted);
    text-wrap: pretty;
  }
  .deck :global(.deck-accent) {
    color: var(--deck-accent);
  }
  .deck :global(.deck-rule) {
    width: 4rem;
    height: 2px;
    margin: 2rem auto 0;
    background: var(--deck-accent);
    border: 0;
  }
  .deck :global(.deck-grid) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: 1rem;
    margin: 2.5rem 0 0;
    padding: 0;
    text-align: left;
    list-style: none;
  }
  .deck :global(.deck-card) {
    padding: 1.25rem 1.375rem;
    background: color-mix(in oklab, var(--deck-fg) 5%, transparent);
    border: 1px solid var(--deck-line);
    border-radius: var(--deck-radius);
  }
  .deck :global(.deck-card h3) {
    margin: 0;
    font-size: 1.0625rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--deck-fg);
  }
  .deck :global(.deck-card p) {
    margin: 0.375rem 0 0;
    font-size: 0.9375rem;
    line-height: 1.4;
    color: var(--deck-muted);
  }

  /* The paper surface. Warm paper, dark ink, a quieter bloom and grain. */
  .deck--paper {
    --deck-bg: #f4efe6;
    --deck-fg: #1c1a17;
    --deck-muted: color-mix(in oklab, var(--deck-fg) 68%, transparent);
    --deck-accent: #c2521f;
    --deck-accent-glow: color-mix(in oklab, var(--deck-accent) 24%, transparent);
    --deck-line: color-mix(in oklab, var(--deck-fg) 14%, transparent);
    --deck-bloom: 0.35;
    --deck-grain: 0.05;
  }
  .deck--paper .deck__bloom {
    mix-blend-mode: normal;
  }
  .deck--paper .deck__grain {
    mix-blend-mode: multiply;
  }

  @media (prefers-color-scheme: light) {
    .deck--auto {
      --deck-bg: #f4efe6;
      --deck-fg: #1c1a17;
      --deck-muted: color-mix(in oklab, var(--deck-fg) 68%, transparent);
      --deck-accent: #c2521f;
      --deck-accent-glow: color-mix(in oklab, var(--deck-accent) 24%, transparent);
      --deck-line: color-mix(in oklab, var(--deck-fg) 14%, transparent);
      --deck-grain: 0.05;
    }
    .deck--auto .deck__bloom {
      mix-blend-mode: normal;
    }
    .deck--auto .deck__grain {
      mix-blend-mode: multiply;
    }
  }

  /* Print to PDF. A fixed 16:9 page keeps one slide to one page. `vh` is not
     the page in print, so the height is set in px to match the page box. */
  @media print {
    .deck {
      position: static;
      width: 100%;
      height: auto;
      aspect-ratio: auto;
      overflow: visible;
    }
    .deck__viewport {
      position: static;
    }
    .deck__bloom,
    .deck__grain,
    .deck__progress,
    .deck__controls {
      display: none !important;
    }
    .deck :global(.slide) {
      position: relative;
      inset: auto;
      display: flex !important;
      width: 100%;
      height: 720px;
      break-after: page;
      page-break-after: always;
      break-inside: avoid;
      opacity: 1 !important;
      visibility: visible !important;
      transform: none !important;
    }
    .deck :global(.slide:last-child) {
      break-after: auto;
      page-break-after: auto;
    }
    @page {
      size: 1280px 720px;
      margin: 0;
    }
  }
</style>
