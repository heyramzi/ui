import { llmsFull, textFile } from "#lib/llms.js";

export const prerender = true;

export const GET = () => textFile(llmsFull(), "text/plain");
