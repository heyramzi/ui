<script lang="ts">
  import { page } from "$app/state";
  import ThemeToggle from "@heyramzi/ui/effects/theme-toggle";
  import githubIcon from "./icons/github.svg?raw";

  const links = [
    ["/components", "Components"],
    ["/charts", "Charts"],
    ["/tasks", "Tasks"],
    ["/agents", "Agents"],
    ["/slides", "Slides"],
    ["/marketing", "Marketing"],
  ];

  let isDark = $state(false);
  $effect(() => {
    isDark = document.documentElement.classList.contains("dark");
  });
  function toggle() {
    isDark = !isDark;
    document.documentElement.classList.toggle("dark", isDark);
    try { localStorage.setItem("theme", isDark ? "dark" : "light"); } catch {}
  }
  const active = (href: string) => page.url.pathname === href || page.url.pathname.startsWith(href + "/");
</script>

<div class="sticky top-0 z-40 flex justify-center px-4 pt-4">
  <div class="flex max-w-full items-center gap-1 rounded-full border border-border bg-background/80 p-1.5 shadow-sm backdrop-blur-xl">
    <a href="/" class="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold tracking-tight">
      <span class="grid size-5 place-items-center rounded-md bg-foreground text-[11px] font-bold text-background">h</span>
      <span class="hidden sm:inline">heyramzi/ui</span>
    </a>
    <nav class="flex min-w-0 items-center overflow-x-auto text-[13px] [scrollbar-width:none]">
      {#each links as [href, label] (href)}
        <a {href} class="whitespace-nowrap rounded-full px-3 py-1.5 transition-colors {active(href) ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}">{label}</a>
      {/each}
    </nav>
    <a href="https://github.com/heyramzi/ui" aria-label="GitHub" class="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      <span class="size-4 [&>svg]:size-full" aria-hidden="true">{@html githubIcon}</span>
    </a>
    <ThemeToggle {isDark} onToggle={toggle} />
  </div>
</div>
