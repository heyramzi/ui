<script lang="ts">
  import "#src/app.css";
  import Nav from "#lib/Nav.svelte";
  import { TooltipProvider } from "@heyramzi/ui/shadcn/tooltip";
  let { children } = $props();
</script>

<svelte:head>
  <title>heyramzi/ui | Svelte 5 components and charts</title>
  <meta name="description" content="Svelte 5 components for our product teams: UI primitives, charts, effects, tasks, agents and slides." />
</svelte:head>

<!-- The provider an app mounts once at its root: the primitives' demos assume one is there. -->
<TooltipProvider>
  <Nav />
  <main>{@render children()}</main>
</TooltipProvider>
<footer class="mx-auto mt-24 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-8 text-sm text-muted-foreground">
  <span>Internal component library.</span>
  <a class="hover:text-foreground" href="https://github.com/heyramzi/ui">github.com/heyramzi/ui</a>
</footer>
