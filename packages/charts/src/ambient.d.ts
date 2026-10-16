/**
 * A stylesheet imported for its side effect, bundled by the consumer's Vite.
 */
declare module "*.css";

/**
 * An SVG's markup, inlined as a string at build time by the consumer's Vite. The kit's showcase
 * stage imports its icons this way, and a type check that follows the import needs it too.
 */
declare module "*.svg?raw" {
  const content: string;
  export default content;
}
