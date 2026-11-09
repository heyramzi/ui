import { llmsFull, textFile } from "#lib/llms.js";

export const prerender = true;

export const GET = async () => textFile(await llmsFull(), "text/plain");
