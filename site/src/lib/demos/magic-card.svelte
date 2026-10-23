<script lang="ts">
	import MagicCard from "@heyramzi/ui/effects/magic-card";
</script>

<div class="grid w-full gap-4 sm:grid-cols-2">
	<MagicCard>
		<p class="font-medium">Follows the pointer</p>
		<p class="text-muted-foreground text-sm">Move across the card and the glow tracks you.</p>
	</MagicCard>
	<MagicCard class="[--magic-card-glow:oklch(0.65_0.2_285)]" radius={300}>
		<p class="font-medium">Brand colour, tighter</p>
		<p class="text-muted-foreground text-sm">
			A custom property sets the colour, radius sets the reach.
		</p>
	</MagicCard>
</div>
