import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const sitemap = fileURLToPath(new URL("../build/sitemap.xml", import.meta.url));

/**
 * Every page the build prerendered, from its sitemap. That route globs the route folders and
 * expands dynamic ones from nav.ts, so a new page is covered unasked.
 */
export function galleryPages(): string[] {
  if (!existsSync(sitemap)) {
    throw new Error(
      "gallery: site/build/sitemap.xml is missing. Run `pnpm test:gallery`, which builds first.",
    );
  }
  const xml = readFileSync(sitemap, "utf8");
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  if (paths.length === 0) throw new Error("gallery: the sitemap lists no pages");
  return paths;
}

/** A page path as a file name: `/components/button` becomes `components-button`, `/` is `home`. */
export function pageSlug(path: string): string {
  return path === "/" ? "home" : path.slice(1).replaceAll("/", "-");
}
