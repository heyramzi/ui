<script lang="ts">
  import ImageComparison from "@heyramzi/ui/effects/image-comparison";

  const plate = (bg: string, fg: string, text: string) =>
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270"><rect width="480" height="270" fill="${bg}"/><text x="50%" y="52%" text-anchor="middle" font-family="sans-serif" font-size="34" fill="${fg}">${text}</text></svg>`,
    );
</script>

<div class="w-full max-w-md">
  <ImageComparison
    class="aspect-video rounded-xl"
    before={{ src: plate("#1f2937", "#9ca3af", "Before"), alt: "The page before the redesign" }}
    after={{ src: plate("#0ea5e9", "#052e3f", "After"), alt: "The page after the redesign" }}
  />
</div>
