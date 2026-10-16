<script lang="ts">
  import { TestimonialHighlight } from "@heyramzi/marketing/testimonials/svelte";
  import type { PublicTestimonial } from "@heyramzi/marketing/testimonials/types";

  const testimonials: PublicTestimonial[] = [
    {
      id: "t1",
      authorName: "Maya Chen",
      authorRole: "Operations lead",
      authorCompany: "Northwind Traders",
      authorPhotoUrl: null,
      content: "The board cut our weekly planning meeting in half. Everything lives in one place now.",
      excerpt: "Planning takes half the time it used to.",
      rating: 5,
      videoUrl: null,
      locale: "en",
      tags: ["planning"],
      isFeatured: true,
      createdAt: "2026-09-14",
    },
  ];
</script>

<div class="w-full max-w-md">
  <TestimonialHighlight {testimonials} />
</div>
