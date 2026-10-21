/**
 * A stylesheet imported for its side effect, bundled by the consumer's Vite.
 */
declare module "*.css";

/**
 * An SVG imported as a URL, resolved by the consumer's Vite.
 */
declare module "*.svg" {
  const src: string;
  export default src;
}
