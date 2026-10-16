<script lang="ts">
  import { ImageReveal } from "@heyramzi/ui/effects/image-reveal";

  type RevealControl = { triggerReveal: (opts?: { hold?: "auto" | "manual" }) => void };

  const plate = (bg: string, fg: string, text: string) =>
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300"><rect width="480" height="300" fill="${bg}"/><text x="50%" y="52%" text-anchor="middle" font-family="sans-serif" font-size="36" fill="${fg}">${text}</text></svg>`,
    );

  const images = [plate("#312e81", "#c7d2fe", "Study one"), plate("#134e4a", "#99f6e4", "Study two")];
  let reveal = $state<RevealControl>();
</script>

<div class="flex w-full max-w-sm flex-col gap-2.5">
  <div class="h-44 w-full overflow-hidden rounded-xl border border-border">
    <ImageReveal bind:this={reveal} src={images} autoReveal revealHoldMs={2200} />
  </div>
  <button type="button" onclick={() => reveal?.triggerReveal()} class="self-start rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium">Reveal image</button>
</div>
