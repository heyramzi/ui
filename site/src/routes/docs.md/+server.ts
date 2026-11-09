import { docsMarkdown, textFile } from "#lib/llms.js";

export const prerender = true;

export const GET = () => textFile(docsMarkdown(), "text/markdown");
