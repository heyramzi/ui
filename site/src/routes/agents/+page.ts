import { redirect } from "@sveltejs/kit";

// Agents was a page of its own until the docs tree. Old links land on the cast.
export function load() {
  redirect(308, "/components/agent-cast");
}
