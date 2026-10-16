<script lang="ts">
  import ImageComparison from "@heyramzi/ui/effects/image-comparison";

  const plate = (bg: string, fg: string, text: string) =>
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270"><rect width="480" height="270" fill="${bg}"/><text x="50%" y="52%" text-anchor="middle" font-family="sans-serif" font-size="34" fill="${fg}">${text}</text></svg>`,
    );

  let position = $state(50);
</script>

<div class="flex w-full max-w-md flex-col gap-2">
  <ImageComparison
    class="aspect-video rounded-xl"
    bind:position
    hint={[20, 75]}
    before={{ src: plate("#1f2937", "#9ca3af", "Before"), alt: "The page before the redesign" }}
    after={{ src: plate("#0ea5e9", "#052e3f", "After"), alt: "The page after the redesign" }}
  >
    {#snippet beforeBadge()}
      <span class="rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">Before</span>
    {/snippet}
    {#snippet afterBadge()}
      <span class="rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">After</span>
    {/snippet}
  </ImageComparison>
  <p class="text-muted-foreground text-xs tabular-nums">Handle at {Math.round(position)}%</p>
</div>
