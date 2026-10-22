<script lang="ts">
  import { StarRatingInput } from "@heyramzi/ui/components/star-rating-input";

  const labels = ["Poor", "Fair", "Good", "Very good", "Excellent"] as const;

  let rating = $state(0);
  let small = $state(4);
</script>

<div class="flex flex-col items-start gap-6">
  <StarRatingInput bind:value={rating} size="lg" {labels} showLabel ariaLabel="Rate the delivery" />
  <StarRatingInput bind:value={small} />
  <StarRatingInput value={3} readonly ariaLabel="Rated 3 of 5" />
  <StarRatingInput value={2} disabled />
</div>
