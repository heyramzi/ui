import { packageImports } from "#lib/ai-context.js";
import {
  docBlocks,
  docsDescription,
  docsIntro,
  docsTitle,
  peers,
  peersTitle,
} from "#lib/docs-content.js";
import { entries, importOf, sectionById, sections, type Entry } from "#lib/registry.js";

/** The production origin every absolute link in the machine-readable files points at. */
export const SITE = "https://ui.heyramzi.com";

const NAME = "@heyramzi/ui";

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
  parts.push("", "## Demo", "", fence("svelte", entry.source));
  return parts.join("\n") + "\n";
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
    "## Docs",
    "",
    link(docsTitle, "/docs.md", docsDescription),
  ];
  for (const section of sections) {
    const inSection = entries.filter((e) => e.section === section.id);
    if (!inSection.length) continue;
    parts.push("", `## ${section.title}`, "");
    for (const e of inSection) parts.push(link(e.title, `/components/${e.slug}.md`, e.description));
  }
  return parts.join("\n") + "\n";
}

/** `/llms-full.txt`: the docs page and every component page, in sidebar order, in one file. */
export function llmsFull(): string {
  const pages = [docsMarkdown(), ...entries.map(componentMarkdown)];
  return `# ${NAME}\n\n> ${summary}\n\n---\n\n${pages.join("\n---\n\n")}`;
}

/** A prerendered text file with its media type. */
export function textFile(body: string, type: "text/plain" | "text/markdown" | "application/xml") {
  return new Response(body, { headers: { "content-type": `${type}; charset=utf-8` } });
}
