import { llmsIndex, textFile } from "#lib/llms.js";

export const prerender = true;

export const GET = () => textFile(llmsIndex(), "text/plain");
