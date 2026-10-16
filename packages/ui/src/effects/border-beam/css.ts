import {
  type BorderBeamColorVariant,
  type BorderBeamSize,
  type ResolvedTheme,
  lineBloomGradient,
  lineBorderGradient,
  lineInnerGradient,
  mdBorderGradient,
  mdInnerGradient,
  smBorderGradient,
  smInnerGradient,
} from "#src/effects/border-beam/presets.js";

export interface CssOptions {
  id: string;
  borderRadius: number;
  borderWidth: number;
  duration: number;
  strokeOpacity: number;
  innerOpacity: number;
  bloomOpacity: number;
  innerShadow: string;
  size: BorderBeamSize;
  colorVariant: BorderBeamColorVariant;
  staticColors: boolean;
  brightness: number;
  saturation: number;
  hueRange: number;
  theme: ResolvedTheme;
  colors?: string[];
  bloom: boolean;
}

// WHY: shared rule blocks every variant emits so paused/reduced-motion/
// isolation behavior stays consistent across sm/md/line. Inlined into each
// variant's template literal at the end so all selectors reference its id.
function commonHostRules(id: string): string {
  return `
[data-beam="${id}"][data-paused],
[data-beam="${id}"][data-paused]::before,
[data-beam="${id}"][data-paused]::after,
[data-beam="${id}"][data-paused] [data-beam-bloom] { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  [data-beam="${id}"][data-active],
  [data-beam="${id}"][data-fading] { animation: none; }
  [data-beam="${id}"][data-active]::before,
  [data-beam="${id}"][data-active]::after,
  [data-beam="${id}"][data-fading]::before,
  [data-beam="${id}"][data-fading]::after,
  [data-beam="${id}"][data-active] [data-beam-bloom],
  [data-beam="${id}"][data-fading] [data-beam-bloom] { animation: none; }
  [data-beam="${id}"][data-active] { --beam-opacity-${id}: 1; }
  [data-beam="${id}"][data-fading] { --beam-opacity-${id}: 0; }
}`;
}

// WHY: sm and md share property registrations, host rules, and the spin/ fade keyframe set verbatim.

// Pulling them into helpers removes ~30 lines of duplication per variant and keeps the two in lockstep.

// Line variant has its own header (more @property entries, different keyframes) so it keeps its inline body.
function spinHeader(id: string, borderRadius: number, duration: number): string {
  return `
@property --beam-angle-${id} { syntax: "<angle>"; initial-value: 0deg; inherits: true; }
@property --beam-opacity-${id} { syntax: "<number>"; initial-value: 0; inherits: true; }

[data-beam="${id}"] { position: relative; border-radius: ${borderRadius}px; overflow: hidden; }
[data-beam="${id}"][data-active] { animation: beam-spin-${id} ${duration}s linear infinite, beam-fade-in-${id} 0.6s ease forwards; }
[data-beam="${id}"][data-fading] { animation: beam-spin-${id} ${duration}s linear infinite, beam-fade-out-${id} 0.5s ease forwards; }
`;
}

function spinKeyframes(id: string): string {
  return `
@keyframes beam-spin-${id} { to { --beam-angle-${id}: 360deg; } }
@keyframes beam-fade-in-${id} { to { --beam-opacity-${id}: 1; } }
@keyframes beam-fade-out-${id} { from { --beam-opacity-${id}: 1; } to { --beam-opacity-${id}: 0; } }
`;
}

interface HueShift {
  decl: string;
  keyframes: string;
}

// WHY static colours keep a filter: only the hue rotation drifts a fixed palette off-brand.

// Dropping brightness and saturation with it left the ring duller than the bloom beside it, which keeps both.
function hueShift(
  id: string,
  staticColors: boolean,
  hueRange: number,
  brightness: number,
  saturation: number,
): HueShift {
  const grade = `brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)})`;
  if (staticColors) return { decl: `filter: ${grade};`, keyframes: "" };
  const filter = (deg: number) =>
    `filter: hue-rotate(${deg >= 0 ? "" : "-"}${Math.abs(deg)}deg) ${grade};`;
  return {
    decl: `animation: beam-hue-shift-${id} 12s ease-in-out infinite;`,
    keyframes: `
@keyframes beam-hue-shift-${id} {
  0% { ${filter(-hueRange)} }
  50% { ${filter(hueRange)} }
  100% { ${filter(-hueRange)} }
}`,
  };
}

interface BloomBlockOpts {
  id: string;
  borderRadius: number;
  innerR: number;
  borderWidth: number;
  bloomGradient: string;
  brightness: number;
  saturation: number;
  bloomOpacity: number;
}

// WHY: sm and md emit the same bloom layer CSS (only the gradient differs).
// Single helper so a future bloom tweak doesn't have to be applied twice.
function bloomBlock(o: BloomBlockOpts): string {
  return `
[data-beam="${o.id}"] [data-beam-bloom] {
  display: none; position: absolute; inset: 0;
  border-radius: ${o.innerR}px; clip-path: inset(0 round ${o.borderRadius}px);
  background: ${o.bloomGradient};
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  padding: ${o.borderWidth}px;
  filter: blur(8px) brightness(${o.brightness.toFixed(2)}) saturate(${o.saturation.toFixed(2)});
  pointer-events: none; z-index: 3; opacity: 0;
}

[data-beam="${o.id}"][data-active] [data-beam-bloom],
[data-beam="${o.id}"][data-fading] [data-beam-bloom] {
  display: block;
  opacity: calc(var(--beam-opacity-${o.id}) * ${o.bloomOpacity.toFixed(2)} * var(--beam-strength, 1));
}`;
}

// WHY every variant writes its conic sweep out in full instead of holding it

// in one custom property and reusing it: a var() inside the `mask` shorthand is invalid at computed-value time, so the mask resolves to none and the ring floods the element.

// The duplication between the -webkit- and standard mask declarations is the same constraint.
export function generateCss(opts: CssOptions): string {
  if (opts.size === "line") return generateLineCss(opts);
  if (opts.size === "sm") return generateSmCss(opts);
  return generateMdCss(opts);
}

function generateSmCss(o: CssOptions): string {
  const {
    id,
    borderRadius,
    borderWidth,
    duration,
    strokeOpacity,
    innerOpacity,
    bloomOpacity,
    innerShadow,
    colorVariant,
    staticColors,
    brightness,
    saturation,
    hueRange,
    theme,
    colors,
    bloom,
  } = o;
  const innerR = Math.max(0, borderRadius - borderWidth);
  const scale = colorVariant === "mono" ? 0.5 : 1;
  const sOp = strokeOpacity * scale;
  const iOp = innerOpacity * scale;
  const bOp = bloomOpacity * scale;
  const hue = hueShift(id, staticColors, hueRange, brightness, saturation);
  const dark = theme === "dark";
  const strokeBeam = dark
    ? `conic-gradient(
        from var(--beam-angle-${id}),
        transparent 0%, transparent 54%,
        rgba(255, 255, 255, 0.1) 57%,
        rgba(255, 255, 255, 0.3) 60%,
        rgba(255, 255, 255, 0.6) 63%,
        rgba(255, 255, 255, 0.75) 66%,
        rgba(255, 255, 255, 0.6) 69%,
        rgba(255, 255, 255, 0.3) 72%,
        rgba(255, 255, 255, 0.1) 75%,
        transparent 78%, transparent 100%
      )`
    : `conic-gradient(
        from var(--beam-angle-${id}),
        transparent 0%, transparent 54%,
        rgba(0, 0, 0, 0.08) 57%,
        rgba(0, 0, 0, 0.2) 60%,
        rgba(0, 0, 0, 0.4) 63%,
        rgba(0, 0, 0, 0.55) 66%,
        rgba(0, 0, 0, 0.4) 69%,
        rgba(0, 0, 0, 0.2) 72%,
        rgba(0, 0, 0, 0.08) 75%,
        transparent 78%, transparent 100%
      )`;
  const border = smBorderGradient(colorVariant, colors);
  const inner = smInnerGradient(colorVariant, colors);
  const bloomBeam = dark
    ? `conic-gradient(
        from var(--beam-angle-${id}),
        transparent 0%, transparent 58%,
        rgba(255, 255, 255, 0.03) 62%,
        rgba(255, 255, 255, 0.08) 65%,
        rgba(255, 255, 255, 0.2) 67%,
        rgba(255, 255, 255, 0.45) 69%,
        rgba(255, 255, 255, 0.85) 70%,
        rgba(255, 255, 255, 0.85) 70.5%,
        rgba(255, 255, 255, 0.45) 71.5%,
        rgba(255, 255, 255, 0.2) 73%,
        rgba(255, 255, 255, 0.08) 75%,
        rgba(255, 255, 255, 0.03) 78%,
        transparent 82%
      )`
    : `conic-gradient(
        from var(--beam-angle-${id}),
        transparent 0%, transparent 58%,
        rgba(0, 0, 0, 0.02) 62%,
        rgba(0, 0, 0, 0.08) 65%,
        rgba(0, 0, 0, 0.2) 67%,
        rgba(0, 0, 0, 0.4) 69%,
        rgba(0, 0, 0, 0.6) 70%,
        rgba(0, 0, 0, 0.6) 70.5%,
        rgba(0, 0, 0, 0.4) 71.5%,
        rgba(0, 0, 0, 0.2) 73%,
        rgba(0, 0, 0, 0.08) 75%,
        rgba(0, 0, 0, 0.02) 78%,
        transparent 82%
      )`;
  const maskConic = `conic-gradient(
    from var(--beam-angle-${id}),
    transparent 0%, transparent 22%,
    rgba(255, 255, 255, 0.12) 28%, rgba(255, 255, 255, 0.4) 36%,
    white 46%, white 82%,
    rgba(255, 255, 255, 0.4) 88%, rgba(255, 255, 255, 0.12) 94%,
    transparent 97%, transparent 100%
  )`;
  const ringMask = `conic-gradient(from var(--beam-angle-${id}), transparent 0%, transparent 30%, rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%, white 52%, white 80%, rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%, transparent 95%, transparent 100%)`;
  const bloomCss = bloom
    ? bloomBlock({
        id,
        borderRadius,
        innerR,
        borderWidth,
        bloomGradient: bloomBeam,
        brightness,
        saturation,
        bloomOpacity: bOp,
      })
    : "";
  return `
${spinHeader(id, borderRadius, duration)}
[data-beam="${id}"][data-active]::after,
[data-beam="${id}"][data-fading]::after {
  content: ""; position: absolute; inset: 0;
  border-radius: ${innerR}px; padding: ${borderWidth}px;
  clip-path: inset(0 round ${borderRadius}px);
  background: ${strokeBeam},${border};
  -webkit-mask: ${ringMask}, linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: source-in, xor;
  mask: ${ringMask}, linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: intersect, exclude;
  pointer-events: none; z-index: 2;
  opacity: calc(var(--beam-opacity-${id}) * ${sOp.toFixed(2)} * var(--beam-strength, 1));
  ${hue.decl}
}

[data-beam="${id}"][data-active]::before,
[data-beam="${id}"][data-fading]::before {
  content: ""; position: absolute; inset: 0;
  border-radius: ${borderRadius}px;
  clip-path: inset(0 round ${borderRadius}px);
  background: ${inner};
  box-shadow: inset 0 0 5px 1px ${innerShadow};
  -webkit-mask-image: ${maskConic};
  -webkit-mask-composite: source-over;
  mask-image: ${maskConic};
  mask-composite: add;
  pointer-events: none; z-index: 1;
  opacity: calc(var(--beam-opacity-${id}) * ${iOp.toFixed(2)} * var(--beam-strength, 1));
  ${hue.decl}
}
${bloomCss}
${spinKeyframes(id)}
${hue.keyframes}
${commonHostRules(id)}
`;
}

function generateMdCss(o: CssOptions): string {
  const {
    id,
    borderRadius,
    borderWidth,
    duration,
    strokeOpacity,
    innerOpacity,
    bloomOpacity,
    innerShadow,
    colorVariant,
    staticColors,
    brightness,
    saturation,
    hueRange,
    theme,
    colors,
    bloom,
  } = o;
  const innerR = Math.max(0, borderRadius - borderWidth);
  const scale = colorVariant === "mono" ? 0.5 : 1;
  const sOp = strokeOpacity * scale;
  const iOp = innerOpacity * scale;
  const bOp = bloomOpacity * scale;
  const hue = hueShift(id, staticColors, hueRange, brightness, saturation);
  const dark = theme === "dark";
  const strokeBeam = dark
    ? `conic-gradient(from var(--beam-angle-${id}), transparent 0%, transparent 54%, rgba(255, 255, 255, 0.1) 57%, rgba(255, 255, 255, 0.3) 60%, rgba(255, 255, 255, 0.6) 63%, rgba(255, 255, 255, 0.75) 66%, rgba(255, 255, 255, 0.6) 69%, rgba(255, 255, 255, 0.3) 72%, rgba(255, 255, 255, 0.1) 75%, transparent 78%, transparent 100%)`
    : `conic-gradient(from var(--beam-angle-${id}), transparent 0%, transparent 54%, rgba(0, 0, 0, 0.08) 57%, rgba(0, 0, 0, 0.2) 60%, rgba(0, 0, 0, 0.4) 63%, rgba(0, 0, 0, 0.55) 66%, rgba(0, 0, 0, 0.4) 69%, rgba(0, 0, 0, 0.2) 72%, rgba(0, 0, 0, 0.08) 75%, transparent 78%, transparent 100%)`;
  const border = mdBorderGradient(colorVariant, colors);
  const inner = mdInnerGradient(colorVariant, colors);
  const bloomBeam = dark
    ? `conic-gradient(from var(--beam-angle-${id}), transparent 0%, transparent 58%, rgba(255, 255, 255, 0.03) 62%, rgba(255, 255, 255, 0.08) 65%, rgba(255, 255, 255, 0.2) 67%, rgba(255, 255, 255, 0.45) 69%, rgba(255, 255, 255, 0.85) 70%, rgba(255, 255, 255, 0.85) 70.5%, rgba(255, 255, 255, 0.45) 71.5%, rgba(255, 255, 255, 0.2) 73%, rgba(255, 255, 255, 0.08) 75%, rgba(255, 255, 255, 0.03) 78%, transparent 82%)`
    : `conic-gradient(from var(--beam-angle-${id}), transparent 0%, transparent 58%, rgba(0, 0, 0, 0.02) 62%, rgba(0, 0, 0, 0.08) 65%, rgba(0, 0, 0, 0.2) 67%, rgba(0, 0, 0, 0.4) 69%, rgba(0, 0, 0, 0.6) 70%, rgba(0, 0, 0, 0.6) 70.5%, rgba(0, 0, 0, 0.4) 71.5%, rgba(0, 0, 0, 0.2) 73%, rgba(0, 0, 0, 0.08) 75%, rgba(0, 0, 0, 0.02) 78%, transparent 82%)`;
  const conicMask = `conic-gradient(from var(--beam-angle-${id}), transparent 0%, transparent 30%, rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%, white 52%, white 80%, rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%, transparent 95%, transparent 100%)`;
  const bloomCss = bloom
    ? bloomBlock({
        id,
        borderRadius,
        innerR,
        borderWidth,
        bloomGradient: bloomBeam,
        brightness,
        saturation,
        bloomOpacity: bOp,
      })
    : "";
  return `
${spinHeader(id, borderRadius, duration)}
[data-beam="${id}"][data-active]::after,
[data-beam="${id}"][data-fading]::after {
  content: ""; position: absolute; inset: 0;
  border-radius: ${innerR}px; padding: ${borderWidth}px;
  clip-path: inset(0 round ${borderRadius}px);
  background: ${strokeBeam},${border};
  -webkit-mask: ${conicMask}, linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: source-in, xor;
  mask: ${conicMask}, linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: intersect, exclude;
  pointer-events: none; z-index: 2;
  opacity: calc(var(--beam-opacity-${id}) * ${sOp.toFixed(2)} * var(--beam-strength, 1));
  ${hue.decl}
}

[data-beam="${id}"][data-active]::before,
[data-beam="${id}"][data-fading]::before {
  content: ""; position: absolute; inset: 0;
  border-radius: ${borderRadius}px;
  background: ${inner};
  box-shadow: inset 0 0 9px 1px ${innerShadow};
  -webkit-mask-image: ${conicMask}, linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white), linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
  -webkit-mask-composite: source-in, source-over;
  mask-image: ${conicMask}, linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white), linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
  mask-composite: intersect, add;
  pointer-events: none; z-index: 1;
  opacity: calc(var(--beam-opacity-${id}) * ${iOp.toFixed(2)} * var(--beam-strength, 1));
  clip-path: inset(0 round ${borderRadius}px);
  ${hue.decl}
}
${bloomCss}
${spinKeyframes(id)}
${hue.keyframes}
${commonHostRules(id)}
`;
}

function generateLineCss(o: CssOptions): string {
  const {
    id,
    borderRadius,
    borderWidth,
    duration,
    strokeOpacity,
    innerOpacity,
    bloomOpacity,
    innerShadow,
    colorVariant,
    staticColors,
    brightness,
    saturation,
    hueRange,
    theme,
    colors,
    bloom,
  } = o;
  const innerR = Math.max(0, borderRadius - borderWidth);
  const dark = theme === "dark";
  const grade = `brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)})`;
  // The bloom's blur lives in its filter, so a static beam has to state it too.
  const hueAnim = staticColors
    ? `filter: ${grade};`
    : `animation: beam-hue-shift-${id} 12s ease-in-out infinite;`;
  const bloomAnim = staticColors
    ? `filter: blur(8px) ${grade};`
    : `animation: beam-hue-shift-bloom-${id} 8s ease-in-out infinite;`;
  const hueKeyframes = staticColors
    ? ""
    : `
@keyframes beam-hue-shift-${id} {
  0% { filter: hue-rotate(-${hueRange}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
  50% { filter: hue-rotate(${hueRange}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
  100% { filter: hue-rotate(-${hueRange}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
}

@keyframes beam-hue-shift-bloom-${id} {
  0% { filter: blur(8px) hue-rotate(-${hueRange + 10}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
  50% { filter: blur(8px) hue-rotate(${hueRange + 10}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
  100% { filter: blur(8px) hue-rotate(-${hueRange + 10}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
}`;
  const highlight = dark
    ? `radial-gradient(ellipse calc(24px * var(--beam-w-${id})) calc(28px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) calc(100% + 2px), rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.12) 30%, transparent 65%)`
    : `radial-gradient(ellipse calc(35px * var(--beam-w-${id})) calc(28px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) calc(100% + 2px), rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.25) 35%, transparent 70%)`;
  const border = lineBorderGradient(colorVariant, dark, id, colors);
  const inner = lineInnerGradient(colorVariant, id, colors);
  const bloomGrad = lineBloomGradient(colorVariant, dark, id, colors);
  return `
@property --beam-x-${id} { syntax: "<number>"; initial-value: 0; inherits: true; }
@property --beam-w-${id} { syntax: "<number>"; initial-value: 1; inherits: true; }
@property --beam-h-${id} { syntax: "<number>"; initial-value: 1; inherits: true; }
@property --beam-spike-${id} { syntax: "<number>"; initial-value: 1; inherits: true; }
@property --beam-spike2-${id} { syntax: "<number>"; initial-value: 1; inherits: true; }
@property --beam-edge-${id} { syntax: "<number>"; initial-value: 1; inherits: true; }
@property --beam-opacity-${id} { syntax: "<number>"; initial-value: 0; inherits: true; }

[data-beam="${id}"] { position: relative; border-radius: ${borderRadius}px; overflow: hidden; }

[data-beam="${id}"][data-active] {
  animation:
    beam-travel-${id} ${duration}s linear infinite,
    beam-edge-fade-${id} ${duration}s linear infinite,
    beam-breathe-${id} ${(duration * 1.3).toFixed(1)}s ease-in-out infinite,
    beam-spike-${id} ${(duration * 1.33).toFixed(1)}s ease-in-out infinite,
    beam-spike2-${id} ${(duration * 1.7).toFixed(1)}s ease-in-out infinite,
    beam-fade-in-${id} 0.6s ease forwards;
}

[data-beam="${id}"][data-fading] {
  animation:
    beam-travel-${id} ${duration}s linear infinite,
    beam-edge-fade-${id} ${duration}s linear infinite,
    beam-breathe-${id} ${(duration * 1.3).toFixed(1)}s ease-in-out infinite,
    beam-spike-${id} ${(duration * 1.33).toFixed(1)}s ease-in-out infinite,
    beam-spike2-${id} ${(duration * 1.7).toFixed(1)}s ease-in-out infinite,
    beam-fade-out-${id} 0.5s ease forwards;
}

[data-beam="${id}"][data-active]::after,
[data-beam="${id}"][data-fading]::after {
  content: ""; position: absolute; inset: 0;
  border-radius: ${innerR}px; padding: ${borderWidth}px;
  clip-path: inset(0 round ${borderRadius}px);
  background: ${highlight}, ${border};
  -webkit-mask: radial-gradient(ellipse calc(78px * var(--beam-w-${id})) calc(60px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) 100%, white 0%, rgba(255, 255, 255, 0.5) 45%, transparent 100%), linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: source-in, xor;
  mask: radial-gradient(ellipse calc(78px * var(--beam-w-${id})) calc(60px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) 100%, white 0%, rgba(255, 255, 255, 0.5) 45%, transparent 100%), linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: intersect, exclude;
  pointer-events: none; z-index: 2;
  opacity: calc(var(--beam-opacity-${id}) * var(--beam-edge-${id}) * ${strokeOpacity.toFixed(2)} * var(--beam-strength, 1));
  ${hueAnim}
}

[data-beam="${id}"][data-active]::before,
[data-beam="${id}"][data-fading]::before {
  content: ""; position: absolute; inset: 0;
  border-radius: ${borderRadius}px;
  background: ${inner};
  box-shadow: inset 0 0 9px 1px ${innerShadow};
  -webkit-mask-image: radial-gradient(ellipse calc(78px * var(--beam-w-${id})) calc(60px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) 100%, white 0%, rgba(255, 255, 255, 0.5) 45%, transparent 100%), linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white), linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
  -webkit-mask-composite: source-in, source-over;
  mask-image: radial-gradient(ellipse calc(78px * var(--beam-w-${id})) calc(60px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) 100%, white 0%, rgba(255, 255, 255, 0.5) 45%, transparent 100%), linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white), linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
  mask-composite: intersect, add;
  pointer-events: none; z-index: 1;
  opacity: calc(var(--beam-opacity-${id}) * var(--beam-edge-${id}) * ${innerOpacity.toFixed(2)} * var(--beam-strength, 1));
  clip-path: inset(0 round ${borderRadius}px);
  ${hueAnim}
}

${
  bloom
    ? `
[data-beam="${id}"] [data-beam-bloom] {
  display: none; position: absolute; inset: 0;
  border-radius: ${innerR}px; clip-path: inset(0 round ${borderRadius}px);
  padding: 0;
  -webkit-mask: radial-gradient(ellipse calc(84px * var(--beam-w-${id})) calc(110px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) 100%, white 0%, rgba(255, 255, 255, 0.5) 35%, transparent 100%);
  -webkit-mask-composite: source-over;
  mask: radial-gradient(ellipse calc(84px * var(--beam-w-${id})) calc(110px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) 100%, white 0%, rgba(255, 255, 255, 0.5) 35%, transparent 100%);
  mask-composite: add;
  background: ${bloomGrad};
  pointer-events: none; z-index: 3; opacity: 0;
}

[data-beam="${id}"][data-active] [data-beam-bloom],
[data-beam="${id}"][data-fading] [data-beam-bloom] {
  display: block;
  opacity: calc(var(--beam-opacity-${id}) * var(--beam-edge-${id}) * ${bloomOpacity.toFixed(2)} * var(--beam-strength, 1));
  ${bloomAnim}
}`
    : ""
}

@keyframes beam-travel-${id} {
  0%   { --beam-x-${id}: 0.06;  --beam-w-${id}: 0.5; }
  10%  { --beam-x-${id}: 0.15;  --beam-w-${id}: 0.8; }
  20%  { --beam-x-${id}: 0.25;  --beam-w-${id}: 1.1; }
  30%  { --beam-x-${id}: 0.35;  --beam-w-${id}: 1.3; }
  40%  { --beam-x-${id}: 0.44;  --beam-w-${id}: 1.45; }
  50%  { --beam-x-${id}: 0.5;   --beam-w-${id}: 1.5; }
  60%  { --beam-x-${id}: 0.56;  --beam-w-${id}: 1.45; }
  70%  { --beam-x-${id}: 0.65;  --beam-w-${id}: 1.3; }
  80%  { --beam-x-${id}: 0.75;  --beam-w-${id}: 1.1; }
  90%  { --beam-x-${id}: 0.85;  --beam-w-${id}: 0.8; }
  100% { --beam-x-${id}: 0.94;  --beam-w-${id}: 0.5; }
}

@keyframes beam-edge-fade-${id} {
  0%    { --beam-edge-${id}: 0; }
  12.5% { --beam-edge-${id}: 0; }
  32.5% { --beam-edge-${id}: 1; }
  67.5% { --beam-edge-${id}: 1; }
  87.5% { --beam-edge-${id}: 0; }
  100%  { --beam-edge-${id}: 0; }
}

@keyframes beam-breathe-${id} {
  0%, 100% { --beam-h-${id}: 0.8; }
  25%      { --beam-h-${id}: 1.25; }
  55%      { --beam-h-${id}: 0.85; }
  80%      { --beam-h-${id}: 1.3; }
}

@keyframes beam-spike-${id} {
  0%   { --beam-spike-${id}: 0.8; }
  25%  { --beam-spike-${id}: 1.3; }
  50%  { --beam-spike-${id}: 0.9; }
  75%  { --beam-spike-${id}: 1.4; }
  100% { --beam-spike-${id}: 0.8; }
}

@keyframes beam-spike2-${id} {
  0%   { --beam-spike2-${id}: 1.2; }
  25%  { --beam-spike2-${id}: 0.7; }
  50%  { --beam-spike2-${id}: 1.4; }
  75%  { --beam-spike2-${id}: 0.8; }
  100% { --beam-spike2-${id}: 1.2; }
}

@keyframes beam-fade-in-${id} { to { --beam-opacity-${id}: 1; } }
@keyframes beam-fade-out-${id} { from { --beam-opacity-${id}: 1; } to { --beam-opacity-${id}: 0; } }
${hueKeyframes}
${commonHostRules(id)}
`;
}
