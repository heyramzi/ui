export { default as BorderBeam } from "#src/effects/border-beam/BorderBeam.svelte";
export type { BorderBeamProps } from "#src/effects/border-beam/types.js";
export type {
  BorderBeamColorVariant,
  BorderBeamSize,
  BorderBeamTheme,
  SizeConfig,
  ThemeColors,
} from "#src/effects/border-beam/presets.js";
export { sizePresets, sizeThemePresets, themeColors } from "#src/effects/border-beam/presets.js";

export { default as ThemeToggle } from "#src/effects/theme-toggle/ThemeToggle.svelte";

export { default as AnimatedBeam } from "#src/effects/animated-beam/AnimatedBeam.svelte";
export type { AnimatedBeamProps, AnchorPosition } from "#src/effects/animated-beam/types.js";

export { default as Spotlight } from "#src/effects/spotlight/Spotlight.svelte";

export { default as MagicCard } from "#src/effects/magic-card/MagicCard.svelte";

export { default as Marquee } from "#src/effects/marquee/Marquee.svelte";

export { default as ImageReveal } from "#src/effects/image-reveal/ImageReveal.svelte";
export type { ImageRevealProps, ImageRevealHandle } from "#src/effects/image-reveal/types.js";

export { default as ShaderGradient } from "#src/effects/shader-gradient/ShaderGradient.svelte";
export type {
  ShaderGradientProps,
  ShaderGradientUniforms,
} from "#src/effects/shader-gradient/types.js";

export { default as InView } from "#src/effects/reveal/InView.svelte";
export { default as AnimatedGroup } from "#src/effects/reveal/AnimatedGroup.svelte";
export { default as TextEffect } from "#src/effects/reveal/TextEffect.svelte";
export { observeInView } from "#src/effects/reveal/observe.js";
export type {
  RevealPreset,
  RevealPer,
  RevealTiming,
  RevealViewOptions,
} from "#src/effects/reveal/types.js";

export { default as ProgressiveBlur } from "#src/effects/progressive-blur/ProgressiveBlur.svelte";

export { default as InteractiveHoverButton } from "#src/effects/interactive-hover-button/InteractiveHoverButton.svelte";

export { default as ImageComparison } from "#src/effects/image-comparison/ImageComparison.svelte";

export { magnetic } from "#src/effects/magnetic/magnetic.js";
export type { MagneticOptions } from "#src/effects/magnetic/magnetic.js";

export { revealTheme } from "#src/lib/theme-transition.js";
export type { RevealOrigin, RevealThemeOptions } from "#src/lib/theme-transition.js";
