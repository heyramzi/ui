import { redirect } from "@sveltejs/kit";

// Marketing left the UI site: brand tokens and testimonials aren't UI. Old links land on theming.
export function load() {
  redirect(308, "/components/theming");
}
