<script lang="ts">
  import { mountReview, type ReviewModel } from "@heyramzi/review";
  import "@heyramzi/review/review.css";

  const model: ReviewModel = {
    id: "demo",
    title: "Launch cut",
    route: "On this computer",
    status: { tone: "neutral", text: "Waiting on selects" },
    groups: [],
    passes: [],
    kinds: [],
    paragraphs: [],
    beats: [],
    notes: [],
    session: "idle",
  };

  let host = $state<HTMLElement | null>(null);

  $effect(() => {
    if (!host) return;
    const app = mountReview(host, {
      base: "/review",
      id: "demo",
      client: {
        load: async () => model,
        act: async () => ({ ok: true }),
        subscribe: (handlers) => {
          handlers.model(model);
          handlers.connection(true);
          return () => {};
        },
      },
    });
    return () => app.destroy();
  });
</script>

<div bind:this={host} class="review-demo h-[560px] w-full overflow-hidden rounded-xl border border-border bg-background"></div>

<style>
  .review-demo :global(.rv) {
    color-scheme: dark;
    --accent: var(--brand-on-dark);
    --radius: 10px;
  }

  :global(:root[data-theme="light"]) .review-demo :global(.rv) {
    color-scheme: light;
    --accent: var(--brand);
  }
</style>
