import { SITE, textFile } from "#lib/llms.js";
import { cards, sections } from "#lib/nav.js";

export const prerender = true;

// Keys only: every page route, read off the folder tree so a new page joins the sitemap unasked.
const pages = Object.keys(import.meta.glob("/src/routes/**/+page.svelte"));
// Whole modules, since most never export `prerender` and a named glob import fails the build.
const pageModules = import.meta.glob<{ prerender?: boolean }>("/src/routes/**/+page.ts", {
  eager: true,
});

/** The values a dynamic route is prerendered with, matching each route's own `entries()`. */
const expansions: Record<string, () => string[]> = {
  "/[section]": () => sections.map((s) => `/${s.id}`),
  "/components/[slug]": () => cards.map((c) => `/components/${c.slug}`),
};

function paths(): string[] {
  const out: string[] = [];
  for (const file of pages) {
    if (pageModules[file.replace(/\.svelte$/, ".ts")]?.prerender === false) continue;
    const route = file.replace(/^\/src\/routes/, "").replace(/\/\+page\.svelte$/, "") || "/";
    const pattern = route.replace(/\/\([^)]+\)/g, "") || "/";
    if (!pattern.includes("[")) {
      out.push(pattern);
      continue;
    }
    const expand = expansions[pattern];
    if (!expand) throw new Error(`sitemap: no expansion for dynamic route "${pattern}"`);
    out.push(...expand());
  }
  return [...new Set(out)].sort();
}

const escapeXml = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export function GET() {
  const urls = paths().map((p) => `  <url><loc>${escapeXml(SITE + p)}</loc></url>`);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
  return textFile(body, "application/xml");
}
