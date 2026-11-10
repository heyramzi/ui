import { packageImports } from "#lib/ai-context.js";
import { apiOf, PACKAGE as NAME, SITE, type ApiPart } from "#lib/component-registry.js";
import {
  docBlocks,
  docsDescription,
  docsIntro,
  docsTitle,
  mcpInstall,
  peers,
  peersTitle,
} from "#lib/docs-content.js";
import { examplesOf } from "#lib/examples/index.js";
import { cards, sectionById, sections } from "#lib/nav.js";
import { importOf, loadEntry, type Entry } from "#lib/registry.js";
import { usageSnippets } from "#lib/usage-snippets.js";

export { SITE };

// Every example's text up front: these files only run on the server, at prerender.
const exampleSources = import.meta.glob<string>("./examples/*/*.svelte", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** A fenced block whose fence outlasts any backtick run inside the code. */
function fence(lang: string, code: string): string {
  const longest = Math.max(2, ...[...code.matchAll(/`+/g)].map((m) => m[0].length));
  const ticks = "`".repeat(longest + 1);
  return `${ticks}${lang}\n${code.trim()}\n${ticks}`;
}

/** The Markdown twin of `/components/<slug>`: what the page shows, as text. */
export function componentMarkdown(entry: Entry): string {
  const section = sectionById(entry.section)?.title ?? entry.section;
  const from = importOf(entry);
  const imports = packageImports(entry.source);
  const parts = [
    `# ${entry.title}`,
    "",
    entry.description,
    "",
    `Section: ${section} / ${entry.category}`,
    `Page: ${SITE}/components/${entry.slug}`,
  ];
  if (from) parts.push(`Import path: \`${from}\``);
  if (imports.length) parts.push("", "## Import", "", fence("ts", imports.join("\n")));
  const usage = usageSnippets[entry.slug];
  if (usage) parts.push("", "## Usage", "", fence("svelte", usage));
  const examples = examplesOf(entry.slug);
  if (examples.length) {
    parts.push("", "## Examples");
    for (const example of examples) {
      const source = exampleSources[`./examples/${entry.slug}/${example.name}.svelte`];
      parts.push("", `### ${example.title}`, "", example.note, "", fence("svelte", source));
    }
  }
  parts.push("", "## Demo", "", fence("svelte", entry.source));
  const api = apiOf(entry.slug);
  if (api.length) parts.push("", "## API", ...api.flatMap((part) => apiMarkdown(part, api.length)));
  return parts.join("\n") + "\n";
}

/** A table cell: one line, with its pipes escaped. */
const cell = (text: string) => text.replaceAll("|", "\\|").replace(/\s*\n\s*/g, " ");

/** One part's props as a Markdown table, under its own heading when the page has several. */
function apiMarkdown(part: ApiPart, count: number): string[] {
  const lines = count > 1 ? ["", `### ${part.name}`] : [];
  if (part.props.length) {
    lines.push("", "| Prop | Type | Default | Notes |", "| --- | --- | --- | --- |");
    for (const prop of part.props) {
      const type = prop.values
        ? prop.values.map((v) => cell(`\`${v}\``)).join(" \\| ")
        : prop.type
          ? cell(`\`${prop.type}\``)
          : "";
      const def = prop.default ? cell(`\`${prop.default}\``) : "";
      const notes = [prop.required && "required", prop.bindable && "bindable", prop.description]
        .filter(Boolean)
        .join(". ");
      lines.push(`| \`${prop.name}\` | ${type} | ${def} | ${cell(notes)} |`);
    }
  }
  for (const base of part.bases) {
    const from = base.from ? ` from \`${base.from}\`` : "";
    const omit = base.omit?.length ? `, except \`${base.omit.join(", ")}\`` : "";
    lines.push("", `Every prop of \`${base.label}\`${from}${omit}.`);
  }
  return lines;
}

/** The Markdown twin of `/docs`. */
export function docsMarkdown(): string {
  const parts = [
    `# ${docsTitle}`,
    "",
    docsIntro,
    "",
    `Page: ${SITE}/docs`,
    "",
    "## Sections",
    "",
    ...sections.map((s, i) => `${i + 1}. [${s.title}](${SITE}/${s.id})`),
  ];
  for (const block of docBlocks) {
    parts.push("", `## ${block.title}`);
    for (const step of block.steps)
      parts.push("", `### ${step.label}`, "", fence(step.lang, step.code));
    if (block.id === "install") {
      parts.push(
        "",
        `### ${peersTitle}`,
        "",
        ...peers.map(([name, part]) => `- \`${name}\`: ${part}`),
      );
    }
  }
  return parts.join("\n") + "\n";
}

const summary = `${NAME} is one Svelte 5 package for every app we ship: shadcn-svelte primitives, effects, charts, and whole blocks like a task board or a slide deck, all on one set of tokens so a brand colour reaches every part. Each component is imported by its own path (for example \`@heyramzi/ui/shadcn/button\`), and every link below opens that page as Markdown with its description, import line and demo source.`;

/** `/llms.txt`: the title, the summary, then every docs page and component linked to its Markdown. */
export function llmsIndex(): string {
  const link = (title: string, path: string, description: string) =>
    `- [${title}](${SITE}${path}): ${description}`;
  const parts = [
    `# ${NAME}`,
    "",
    `> ${summary}`,
    "",
    `Every page below in one file: ${SITE}/llms-full.txt`,
    "",
    "## For coding agents",
    "",
    `- MCP server (Streamable HTTP, no auth): ${SITE}/mcp. Add it to Claude Code with \`${mcpInstall}\`. Tools: \`list_components\`, \`search_components\`, \`get_component\`.`,
    `- Registry: ${SITE}/registry.json lists every component with its section, import path, docs and Markdown links, and props.`,
    "",
    "## Docs",
    "",
    link(docsTitle, "/docs.md", docsDescription),
  ];
  for (const section of sections) {
    const inSection = cards.filter((c) => c.section === section.id);
    if (!inSection.length) continue;
    parts.push("", `## ${section.title}`, "");
    for (const e of inSection) parts.push(link(e.title, `/components/${e.slug}.md`, e.description));
  }
  return parts.join("\n") + "\n";
}

/** `/llms-full.txt`: the docs page and every component page, in sidebar order, in one file. */
export async function llmsFull(): Promise<string> {
  const loaded = await Promise.all(cards.map((c) => loadEntry(c.slug)));
  const pages = [docsMarkdown(), ...loaded.map(componentMarkdown)];
  return `# ${NAME}\n\n> ${summary}\n\n---\n\n${pages.join("\n---\n\n")}`;
}

/** A prerendered text file with its media type. */
export function textFile(body: string, type: "text/plain" | "text/markdown" | "application/xml") {
  return new Response(body, { headers: { "content-type": `${type}; charset=utf-8` } });
}
