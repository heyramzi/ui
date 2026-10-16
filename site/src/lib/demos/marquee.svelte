<script lang="ts">
  import Marquee from "@heyramzi/ui/effects/marquee";
  const items = ["Copy source in", "Own the code", "Svelte 5 runes", "Tailwind v4 tokens", "No runtime wrapper", "MIT"];
</script>

<Marquee repeat={4} pauseOnHover class="w-full max-w-xl rounded-xl border border-border bg-card py-3">
  {#each items as item}
    <span class="mx-6 text-sm text-muted-foreground">{item}</span>
  {/each}
</Marquee>
