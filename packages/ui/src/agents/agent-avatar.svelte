<script module lang="ts">
  /* The batching shown-gate and the path caches are shared by every avatar
     on the page, so a row of them comes in together. Engine: ./vendor. */
  import { bakesPending as bakesPendingGlobal } from './vendor/plastic';

  const SHOW_WITHIN = 4000;
  const waiters = new Map<object, { ready: () => boolean; show: () => void }>();

  function showReady() {
    if (bakesPendingGlobal()) return;
    for (const w of waiters.values()) if (!w.ready()) return;
    const all = [...waiters.values()];
    waiters.clear();
    for (const w of all) w.show();
  }

  const pathCache = new Map<string, Path2D>();
  function bodyPath(d: string): Path2D {
    let p = pathCache.get(d);
    if (!p) {
      p = new Path2D(d);
      pathCache.set(d, p);
    }
    return p;
  }

  const partsCache = new Map<string, Path2D[]>();
  function partPaths(d: string): Path2D[] {
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
  function hashSeed(id: string): number {
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
    return ((h >>> 0) % 1000) / 1000;
  }

  export const reducedMotion = (): boolean =>
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import type {
    BotAvatarShading,
    BotAvatarState,
    BotAvatarType,
  } from './vendor/types';
  import type { AgentAvatarProps } from './types';
  import { botAvatarPresets, stateLabels } from './vendor/presets';
  import { SHAPE_PATHS, SHAPE_PARTS } from './vendor/shapes';
  import { autoInk, richer, shade } from './vendor/color';
  import { Sim, restPose } from './vendor/engine';
  import { draw, LIGHT_DEFAULTS, OVERSCAN, RISE, type DrawConfig } from './vendor/draw';
  import {
    bakesPending,
    hurry,
    onLanded,
    stockLights,
    takeMissed,
    warmPlastic,
    type FurStyle,
  } from './vendor/plastic';
  import { subscribe, pointer } from './vendor/ticker';

  type Props = AgentAvatarProps;

  let {
    name,
    role,
    shape = 'clover',
    path,
    face = 'eyes',
    state: botState = 'default',
    size,
    color,
    ink = '#1E1A33',
    brightness: brightnessProp,
    saturation: saturationProp,
    speed = 1,
    paused = false,
    seed,
    shading = 'fabric',
    hat = 'none',
    glasses = 'none',
    headphones = false,
    bowTie = false,
    accessoryColor = '#27272b',
    shadow,
    highlight,
    depth = 0.65,
    roundness = 1,
    furLength = 1,
    furDensity = 1.6,
    furFuzz = 0.9,
    furClumps = 0.4,
    furCurl = 0.7,
    furGravity = 0.9,
    light,
    rim,
    spread,
    backLight,
    lightFront,
    shine,
    sheen,
    backSoftness,
    pose: heldPose,
    interactive = true,
    turn = 1,
    theme = 'auto',
    whirl = 0,
    whirlSize = 1,
    whirlWidth = 1,
    whirlLength = 1,
    whirlTilt = 1,
    jumpHeight = 26,
    jumpTime = 0.68,
    jumpStretch = 1,
    jumpSpin = 1,
    jumpLean = 6,
    jumpEvery = 8,
    jumpLand = 0,
    jumpSquash = 1.15,
    jumpSquashTime = 0.37,
    jumpSquashEase = 'pulse',
    jumpGroundTime = 0.11,
    jumpGroundEase = 'pulse',
    jumpRiseTime = 0.33,
    jumpRiseEase = 'pulse',
    jumpClickSquashTime = 0.24,
    class: className,
    style,
    'aria-label': ariaLabel,
    onclick: userClick,
    ...rest
  }: Props = $props();

  const clamp = (v: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : 1));
  const q = (v: number, lo: number, hi: number) => Math.round(clamp(v, lo, hi) * 20) / 20;
  const clampOpt = (v: number | undefined, d: number, lo: number, hi: number) =>
    clamp(v ?? d, lo, hi);
  const shapePath = (t: BotAvatarType) => SHAPE_PATHS[t] ?? SHAPE_PATHS.clover;
  const deviceDpr = () =>
    Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);

  const uid = `ba-${++uidSeq}`;

  /* The avatar draws at 75% of its slot so an idle jump has room in the box
     and never clips. A numeric `size` overrides the measurement. */
  const JUMP_CLEARANCE = 0.75;
  let hostEl = $state<HTMLElement | null>(null);
  let hostWidth = $state(0);
  const drawnSize = $derived(
    typeof size === 'number' ? size : hostWidth > 0 ? hostWidth * JUMP_CLEARANCE : 0,
  );

  const type = $derived(shape);
  const preset = $derived(botAvatarPresets[type] ?? botAvatarPresets.clover);
  const faceKind = $derived(face ?? preset.face);
  const picked = $derived(color ?? preset.color);
  const brightness = $derived(brightnessProp ?? (preset.brightness ?? 1));
  const saturation = $derived(saturationProp ?? (preset.saturation ?? 1.5));
  const vivid = $derived(clamp(saturation, 1.5, 2.5) - 1.5);
  const body = $derived(
    richer(
      brightness === 1 && saturation === 1
        ? picked
        : shade(
            picked,
            (Math.min(2, Math.max(0, brightness)) - 1) * 0.35,
            (Math.min(1.5, Math.max(0, saturation)) - 1) * 0.5,
          ),
      vivid,
    ),
  );
  const inkColor = $derived(ink ?? autoInk(body));
  const seedValue = $derived(Math.min(1, Math.max(0, seed ?? hashSeed(uid))));
  const stateKey = $derived((botState in stateLabels ? botState : 'default') as BotAvatarState);
  const frozen = $derived(paused || !(speed > 0));
  const shadingMode = $derived(
    (shading === true ? 'crisp' : shading === false ? 'flat' : shading) as BotAvatarShading,
  );
  const customPath = $derived(typeof path === 'string' && path.trim() ? path.trim() : null);
  const outlineKey = $derived(
    customPath ? `path:${hashSeed(customPath)}:${customPath.length}` : type,
  );
  const lit = $derived(LIGHT_DEFAULTS[shadingMode === 'fabric' ? 'fabric' : 'other']);
  const fur = $derived({
    length: q(furLength, 0.3, 2.5),
    density: q(furDensity, 0.3, 2),
    fuzz: q(furFuzz, 0, 1),
    clumps: q(furClumps, 0, 1),
    curl: q(furCurl, 0, 1),
    gravity: q(furGravity, 0, 1),
  } satisfies FurStyle);
  const material = $derived(shadingMode === 'plastic' || shadingMode === 'fabric');
  const lookKey = $derived(`${shadingMode}|${outlineKey}|${Math.round(drawnSize)}`);
  const interactiveNow = $derived(interactive && !heldPose);

  /* Captured once, on purpose: `shown` never returns to false, so a later
     shading change must not reset it. */
  function beginsMaterial() {
    return shading === 'plastic' || shading === 'fabric';
  }

  function partsFor(t: BotAvatarType) {
    return !customPath && SHAPE_PARTS[t] ? partPaths(SHAPE_PARTS[t] as string) : undefined;
  }

  function configure(): DrawConfig {
    return {
      path: bodyPath(customPath ?? shapePath(type)),
      face: faceKind,
      faceX: preset.faceX,
      faceY: preset.faceY,
      faceScale: preset.faceScale,
      color: body,
      ink: inkColor,
      shading: shadingMode,
      shadow: clampOpt(shadow, lit.shadow, 0, 2),
      highlight: clampOpt(highlight, lit.highlight, 0, 2),
      depth: clamp(depth, 0.2, 2),
      roundness: clamp(roundness, 0, 1),
      fur,
      vivid,
      backLight,
      lightFront,
      shine,
      sheen,
      backSoftness,
      light: light ?? lit.light,
      rim: clampOpt(rim, lit.rim, 0, 2),
      spread: clampOpt(spread, lit.spread, 0.4, 2.5),
      typeKey: outlineKey,
      still: frozen || reducedMotion(),
      furOnIdle: true,
      whirl: {
        strength: clamp(whirl, 0, 2),
        size: clamp(whirlSize, 0.6, 1.6),
        width: clamp(whirlWidth, 0.4, 2),
        length: clamp(whirlLength, 0.4, 1.6),
        tilt: clamp(whirlTilt, 0.5, 1.8),
      },
      parts: partsFor(type),
      wear: { hat, glasses, headphones, bowTie, color: accessoryColor, fabric: shadingMode === 'fabric' },
    };
  }

  const cfg = $derived(configure());

  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let sim: Sim | null = null;
  let cssSize = 0;
  let lastLook: string | null = null;

  let shown = $state(!beginsMaterial());
  let shownRef = !beginsMaterial();
  function markShown() {
    shownRef = true;
    shown = true;
  }

  let stillPaint: (() => void) | null = null;
  let waiting: (() => void) | null = null;
  let watch: (() => void) | null = null;
  let showPaint: (() => void) | null = null;
  let ready = false;
  let holding: (() => void) | null = null;
  const meRef = {};

  function resolveTheme(el: HTMLElement | null): 'dark' | 'light' {
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

  function layoutPx(canvas: HTMLCanvasElement) {
    return canvas.clientWidth / OVERSCAN || cssSize || drawnSize || 64;
  }

  function poseFor(rest0: ReturnType<typeof restPose>) {
    const held = heldPose;
    if (held)
      return { ...rest0, yaw: held.yaw ?? 0, pitch: held.pitch ?? rest0.pitch, roll: held.roll ?? rest0.roll };
    return sim ? sim.pose : rest0;
  }

  function paint() {
    const canvas = canvasEl;
    const c = cfg;
    if (!canvas || !c?.path) return;
    const px = layoutPx(canvas);
    if (!px) return;
    const dpr = deviceDpr();
    const want = Math.round(px * OVERSCAN * dpr);
    if (canvas.width !== want || canvas.height !== want) {
      canvas.width = want;
      canvas.height = want;
    }
    cssSize = px;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.dpr = dpr;
    draw(ctx, px, poseFor(restPose(stateKey)), c);
  }

  function paintStill() {
    const canvas = canvasEl;
    const c = cfg;
    if (!canvas || !c?.path) return;
    const px = layoutPx(canvas);
    if (!px) return;
    cssSize = px;
    const dpr = deviceDpr();
    canvas.width = canvas.height = Math.round(px * OVERSCAN * dpr);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      c.theme = resolveTheme(canvas);
      c.dpr = dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, px, restPose(stateKey), c);
    }
  }

  function stopWaiting() {
    if (waiting) waiting();
    waiting = null;
  }

  function settle(paintNow: () => void) {
    takeMissed();
    paintNow();
    if (!takeMissed()) stopWaiting();
    else if (!waiting)
      waiting = onLanded(() => {
        const p = stillPaint;
        if (canvasEl && p) settle(p);
        else stopWaiting();
      });
  }

  function stopWatch() {
    if (watch) watch();
    watch = null;
  }

  function showWhenBaked(paintNow: () => void) {
    showPaint = paintNow;
    takeMissed();
    paintNow();
    ready = !takeMissed();
    if (ready && !bakesPending()) {
      showReady();
      return;
    }
    if (!watch)
      watch = onLanded(() => {
        const p = showPaint;
        if (canvasEl && p && !shownRef) showWhenBaked(p);
        else stopWatch();
        showReady();
      });
  }

  function lightsFor(lightAt: number) {
    const a = (lightAt * Math.PI) / 180;
    const b = ((backLight ?? 0) * Math.PI) / 180;
    const lights = stockLights(Math.sin(a), -Math.cos(a));
    if (backLight !== undefined) [lights.bx, lights.by] = [Math.sin(b), -Math.cos(b)];
    if (lightFront !== undefined) lights.front = (Math.min(85, Math.max(0, lightFront)) * Math.PI) / 180;
    return lights;
  }

  function warm() {
    if (!material || !cfg?.path) return;
    const c = cfg;
    const dev = (drawnSize || 64) * deviceDpr();
    const lightAt = c.light ?? 295;
    warmPlastic(outlineKey, c.path, dev, depth, shadingMode === 'fabric', fur, lightAt, lightsFor(lightAt));
  }

  function warmIdle(fn: () => void): () => void {
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(fn);
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(fn, 1);
    return () => clearTimeout(id);
  }

  function hold() {
    warm();
    if (!bakesPending()) return;
    hurry(true);
    const release = () => {
      if (!holding) return;
      holding();
      holding = null;
      paint();
    };
    const off = onLanded(() => {
      if (!bakesPending()) release();
    });
    const t = setTimeout(release, SHOW_WITHIN);
    holding = () => {
      off();
      clearTimeout(t);
      hurry(false);
    };
  }

  function handleClick(e: MouseEvent) {
    if (interactive && !frozen && !heldPose) sim?.poke();
    userClick?.(e);
  }

  onMount(() => () => {
    stopWaiting();
    holding?.();
    holding = null;
  });

  function shouldHold() {
    return shownRef && material && lastLook !== null && lastLook !== lookKey && !holding;
  }

  function applyPose() {
    if (holding) return;
    if (reducedMotion()) {
      stillPaint = paintStill;
      if (shownRef) settle(paintStill);
      else showWhenBaked(paintStill);
      return;
    }
    if (canvasEl) {
      const c = cfg;
      if (c) c.theme = resolveTheme(canvasEl);
    }
    if (!shownRef) {
      stillPaint = frozen ? paint : null;
      showWhenBaked(paint);
    } else if (frozen) {
      stillPaint = paint;
      settle(paint);
    } else {
      stillPaint = null;
      stopWaiting();
      paint();
    }
  }

  /* Sync the rig with the props on every meaningful change: this is the
     React `useLayoutEffect` (which ran each render) made reactive. */
  $effect(() => {
    if (!sim) sim = new Sim(seedValue, stateKey);
    else sim.setState(stateKey);
    sim.setTurn(clamp(turn, 0, 2));
    if (shouldHold()) hold();
    lastLook = lookKey;
    sim.setJump({
      height: jumpHeight,
      time: Math.max(0.2, jumpTime),
      stretch: jumpStretch,
      spin: Math.max(0, Math.round(jumpSpin)),
      lean: jumpLean,
      every: jumpEvery,
      land: jumpLand,
      squash: jumpSquash,
      squashTime: Math.max(0.05, jumpSquashTime),
      squashEase: jumpSquashEase,
      groundTime: Math.max(0, jumpGroundTime),
      groundEase: jumpGroundEase,
      riseTime: Math.max(0.05, jumpRiseTime),
      riseEase: jumpRiseEase,
      clickSquashTime: Math.max(0.05, jumpClickSquashTime),
    });
    applyPose();
  });

  /* Register with the shared shown-gate so a row of baked avatars appears
     together, or after SHOW_WITHIN at the latest. */
  $effect(() => {
    if (shown) return;
    waiters.set(meRef, { ready: () => ready, show: markShown });
    showReady();
    hurry(true);
    const t = setTimeout(markShown, SHOW_WITHIN);
    return () => {
      hurry(false);
      clearTimeout(t);
      stopWatch();
      waiters.delete(meRef);
      showReady();
    };
  });

  /* Start the material's bakes on idle time as soon as the shape is known. */
  $effect(() => {
    void shadingMode;
    void outlineKey;
    void drawnSize;
    void depth;
    void light;
    void backLight;
    void lightFront;
    if (!material || !cfg?.path) return;
    return warmIdle(warm);
  });

  function pointerStrength(d: number) {
    if (d < 1) return 1;
    if (d > 3) return 0;
    return 1 - (d - 1) / 2;
  }

  function updatePointer(s: Sim, canvas: HTMLCanvasElement) {
    if (!interactiveNow || Number.isNaN(pointer.x)) {
      s.setPointer(0, 0, 0);
      return;
    }
    const r = canvas.getBoundingClientRect();
    const box = r.width / OVERSCAN || 1;
    const dx = (pointer.x - (r.left + r.width / 2)) / box;
    const dy = (pointer.y - (r.top + r.height / 2 + RISE * box)) / box;
    const d = Math.hypot(dx, dy);
    s.setPointer(dx / Math.max(1, d), dy / Math.max(1, d), pointerStrength(d));
  }

  /* The loop, only while visible, animated and not reduced. */
  $effect(() => {
    if (frozen || reducedMotion()) return;
    const canvas = canvasEl;
    if (!canvas) return;
    let unsub: (() => void) | null = null;
    const tick = (dt: number) => {
      const s = sim;
      if (!s) return;
      updatePointer(s, canvas);
      s.update(dt * speed);
      if (shownRef && !holding) paint();
    };
    const run = () => {
      if (!unsub) unsub = subscribe(tick);
    };
    const stop = () => {
      if (unsub) unsub();
      unsub = null;
    };
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === 'function') {
      io = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting ?? true) run();
        else stop();
      });
      io.observe(canvas);
    } else run();
    return () => {
      stop();
      if (io) io.disconnect();
    };
  });

  const canvasStyle = $derived.by(() => {
    const s = drawnSize || 64;
    const dim = `${s * OVERSCAN}px`;
    const side = (OVERSCAN - 1) / 2;
    const pull = (k: number) => `${-s * k}px`;
    return (
      `display:inline-block;vertical-align:middle;width:${dim};height:${dim};` +
      `margin-left:${pull(side)};margin-right:${pull(side)};` +
      `margin-top:${pull(side + RISE)};margin-bottom:${pull(side - RISE)};` +
      `flex:none;opacity:${shown ? 1 : 0};transition:opacity 0.3s ease-out`
    );
  });

  /* No box: the slot carries no border, background or padding. Without an
     explicit size it stays square, and the avatar fills three quarters of it. */
  const hostStyle = $derived.by(() => {
    const base =
      size === undefined
        ? 'display:inline-grid;place-items:center;line-height:0;width:100%;aspect-ratio:1/1;'
        : 'display:inline-block;line-height:0;';
    return style ? `${base}${style}` : base;
  });

  onMount(() => {
    if (!hostEl) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) hostWidth = entry.contentRect.width;
    });
    observer.observe(hostEl);
    return () => observer.disconnect();
  });

  export function getCanvas(): HTMLCanvasElement | null {
    return canvasEl;
  }
</script>

<span
  bind:this={hostEl}
  class={className ? `agent-avatar ${className}` : 'agent-avatar'}
  style={hostStyle}
  data-agent-shape={type}
>
  {#if drawnSize > 0}
    <canvas
      bind:this={canvasEl}
      data-bot-avatar={type}
      data-face={faceKind}
      data-state={stateKey}
      role="img"
      aria-label={ariaLabel ??
        (name ? `${name}${role ? `, ${role}` : ''}` : `${preset.label} agent, ${stateLabels[stateKey]}`)}
      style={canvasStyle}
      onclick={handleClick}
      {...rest}
    ></canvas>
  {/if}
</span>
