import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter({ fallback: "404.html" }),
      prerender: {
        // Demos keep placeholder anchors: upstream's `#/` in any tile, and the record demo's links
        // to records it never renders. Every other anchor still has to land.
        handleMissingId: ({ path, id, message }) => {
          if (id !== "/" && path !== "/tasks/record") throw new Error(message);
        },
      },
    }),
  ],
  // SSR bundles every dependency, because they ship raw .ts and .svelte through @heyramzi/ui,
  // and a partial list loads a second copy of Svelte.
  ssr: { noExternal: true },
});
