import { redirect } from "@sveltejs/kit";

// This page was /tasks until the module became @heyramzi/ui/work. Old links land on its new page.
export function load() {
  redirect(308, "/work");
}
