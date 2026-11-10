import { json } from "@sveltejs/kit";
import { buildRegistry } from "#lib/component-registry.js";

export const prerender = true;

export const GET = async () => json(await buildRegistry());
