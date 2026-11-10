import api from "#lib/component-api.json";
import { cards, sectionById, sections } from "#lib/nav.js";
import { importOf, loadEntry } from "#lib/registry.js";
import pkg from "../../../packages/ui/package.json";

/** The production origin every absolute link in the machine-readable files points at. */
export const SITE = "https://ui.heyramzi.com";

export const PACKAGE = "@heyramzi/ui";

/** A type the part spreads onto its root without expanding it, such as a bits-ui part. */
export type ApiBase = { kind: string; label: string; from?: string; omit?: string[] };

export type ApiProp = {
  name: string;
  type?: string;
  values?: string[];
  default?: string;
  bindable?: boolean;
  required?: boolean;
  description?: string;
};

/** One component file's props, as `scripts/component-api.ts` writes them. */
export type ApiPart = {
  name: string;
  file: string;
  props: ApiProp[];
  bases: ApiBase[];
  untyped?: boolean;
};

export type RegistryComponent = {
  slug: string;
  title: string;
  description: string;
  section: string;
  sectionTitle: string;
  category: string;
  /** The path the demo imports from, such as `@heyramzi/ui/shadcn/tabs`. */
  import: string | null;
  docs: string;
  markdown: string;
  api: ApiPart[];
};

/** `/registry.json`: every component with its links and props, read by the MCP server too. */
export type Registry = {
  name: string;
  version: string;
  homepage: string;
  llms: string;
  llmsFull: string;
  mcp: string;
  sections: { id: string; title: string; categories: string[] }[];
  components: RegistryComponent[];
};

const parts: Record<string, ApiPart[]> = api;

/** A component's props tables, without the files that carry neither props nor a base. */
export const apiOf = (slug: string): ApiPart[] =>
  (parts[slug] ?? []).filter((part) => part.props.length || part.bases.length);

export async function buildRegistry(): Promise<Registry> {
  const entries = await Promise.all(cards.map((c) => loadEntry(c.slug)));
  return {
    name: PACKAGE,
    version: pkg.version,
    homepage: SITE,
    llms: `${SITE}/llms.txt`,
    llmsFull: `${SITE}/llms-full.txt`,
    mcp: `${SITE}/mcp`,
    sections: sections.map((s) => ({
      id: s.id,
      title: s.title,
      categories: s.categories.map((c) => c.title),
    })),
    components: entries.map((e) => ({
      slug: e.slug,
      title: e.title,
      description: e.description,
      section: e.section,
      sectionTitle: sectionById(e.section)?.title ?? e.section,
      category: e.category,
      import: importOf(e) ?? null,
      docs: `${SITE}/components/${e.slug}`,
      markdown: `${SITE}/components/${e.slug}.md`,
      api: apiOf(e.slug),
    })),
  };
}
