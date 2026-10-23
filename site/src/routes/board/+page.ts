import { redirect } from "@sveltejs/kit";

// The package was @heyramzi/board until 0.2. Old links land on its new page.
export function load() {
  redirect(308, "/work");
}
