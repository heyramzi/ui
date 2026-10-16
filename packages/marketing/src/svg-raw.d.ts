/**
 * An icon's markup, inlined as a string at build time by the consumer's Vite.
 */
declare module "*.svg?raw" {
  const content: string;
  export default content;
}
