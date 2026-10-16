// A kit component pulls its stylesheet in with a side-effect import. Vite handles it at
// build time; this declaration lets svelte-check accept it without pulling in vite/client.
declare module "*.css";
