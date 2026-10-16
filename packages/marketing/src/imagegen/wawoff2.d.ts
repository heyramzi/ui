declare module "wawoff2" {
  /** Decompress WOFF2 bytes to a TTF Uint8Array. */
  export function decompress(buffer: Uint8Array | Buffer): Promise<Uint8Array>;
  /** Compress TTF bytes to WOFF2. */
  export function compress(buffer: Uint8Array | Buffer): Promise<Uint8Array>;
}
