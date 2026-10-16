<script lang="ts">
  import { page } from "$app/state";
  import ThemeToggle from "@heyramzi/ui/effects/theme-toggle";

  const links = [
    ["/components", "Components"],
    ["/charts", "Charts"],
    ["/board", "Board"],
    ["/agents", "Agents"],
    ["/slides", "Slides"],
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
      <svg class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></svg>
    </a>
    <ThemeToggle {isDark} onToggle={toggle} />
  </div>
</div>
