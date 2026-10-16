// The showcase of @heyramzi/ui itself: its shadcn primitives,
// its motion vocabulary, its visual effects and its AI surface. The chart set's own section ships with `@heyramzi/charts/showcase`.

// WHY they ship with the package and not with the app showing them: they demo

// what every consumer installs identically, so a second copy in a second app is only a copy that drifts. Recovered from the retired orcastrate GUI (vibe-kit @ ccbccb7a^).

// The shadcn stages are not written here at all: `pnpm sync:shadcn` vendors
// upstream's own example per primitive and generates the list.

// Each section brings its own layout, so render it inside a `ShowcaseSection`
// marked `bare`, or in a bare <section> carrying the anchor id.
export { default as AnimationsSection } from "#src/showcase/AnimationsSection.svelte";
export { default as ShadcnSection } from "#src/showcase/ShadcnSection.svelte";
export { default as EffectsSection } from "#src/showcase/EffectsSection.svelte";
export { default as AiSection } from "#src/showcase/AiSection.svelte";
