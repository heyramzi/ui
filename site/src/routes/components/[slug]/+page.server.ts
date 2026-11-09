import api from "#lib/component-api.json";
import type { ApiPart } from "#lib/ComponentApi.svelte";

export const prerender = true;

const pages: Record<string, ApiPart[]> = api;

// Server-side so each prerendered page carries its own table, not all 118 in the client bundle.
export function load({ params }) {
  const parts = pages[params.slug] ?? [];
  return { api: parts.filter((part) => part.props.length || part.bases.length) };
}
