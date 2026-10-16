import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			preprocess: vitePreprocess(),
			adapter: adapter({ fallback: "404.html" })
		})
	],
	// SSR bundles every dependency. @heyramzi/utils ships raw .ts (Node won't strip types under
	// node_modules), and bits-ui, @tabler/icons-svelte-runes and friends ship raw .svelte. They reach
	// the site only through @heyramzi/ui, so the Svelte plugin never marks them itself, and a partial
	// list loads a second copy of Svelte. The site is prerendered, so nothing runs on Node later.
	ssr: { noExternal: true }
});
