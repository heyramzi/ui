<script lang="ts">
	import { Deck, Slide, Fragment } from "@heyramzi/ui/slides";

	let index = $state(0);
	let step = $state(0);
</script>

<div class="aspect-video w-full max-w-xl overflow-hidden rounded-xl">
	<Deck bind:index bind:step theme="ink" title="Deck demo">
		<Slide align="start" notes="Open on the headline number.">
			<p class="deck-label">Quarterly review</p>
			<h1 class="deck-title mt-4">Numbers are up and to the right</h1>
			<p class="deck-body mt-4">Three slides on what shipped this quarter.</p>
		</Slide>
		<Slide align="start">
			<h2 class="deck-title">Highlights</h2>
			<ul class="mt-6 grid gap-3 p-0 text-left">
				<Fragment as="li" step={1}
					><p class="deck-heading">Launched the new pricing page</p></Fragment
				>
				<Fragment as="li" step={2}><p class="deck-heading">Cut load time in half</p></Fragment>
				<Fragment as="li" step={3}><p class="deck-heading">Published forty components</p></Fragment>
			</ul>
		</Slide>
	</Deck>
</div>
