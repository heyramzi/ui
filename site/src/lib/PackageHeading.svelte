<script lang="ts">
  import Link from "@lucide/svelte/icons/link";

  // The heading of one package section. `id` is the package id, so /#charts, /#ui and
  // /#board stay the same address for as long as the package keeps its id.
  let { id, name, title, blurb }: { id: string; name: string; title: string; blurb: string } = $props();
</script>

<div class="mb-6">
  <p class="font-mono text-sm text-muted-foreground">{name}</p>
  <h2 {id} class="group mt-1 scroll-mt-24 text-2xl font-semibold tracking-tight">
    {title}
    <a
      href="#{id}"
      aria-label="Link to the {title} section"
      class="ml-1 inline-grid size-7 translate-y-0.5 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-60"
    >
      <Link class="size-4" aria-hidden="true" />
    </a>
  </h2>
  <p class="mt-1 text-muted-foreground">{blurb}</p>
</div>
