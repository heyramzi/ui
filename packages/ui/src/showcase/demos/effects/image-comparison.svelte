<script lang="ts">
	import { ImageComparison } from "#src/index.js";

	// Inline SVGs so the demo carries no asset and still shows the wipe.
	const plate = (bg: string, fg: string, text: string) =>
		"data:image/svg+xml;utf8," +
		encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270"><rect width="480" height="270" fill="${bg}"/><text x="50%" y="52%" text-anchor="middle" font-family="sans-serif" font-size="34" fill="${fg}">${text}</text></svg>`,
		);
</script>

<div class="frame">
	<ImageComparison
		class="compare"
		before={{ src: plate("#1f2937", "#9ca3af", "Before"), alt: "The board before the rebuild" }}
		after={{ src: plate("#0ea5e9", "#052e3f", "After"), alt: "The board after the rebuild" }}
	/>
</div>

<style>
	.frame :global(.compare) {
		aspect-ratio: 16 / 9;
		border-radius: 0.75rem;
	}
</style>
