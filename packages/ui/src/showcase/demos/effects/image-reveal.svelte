<script lang="ts">
	import { ImageReveal, type ImageRevealHandle } from "#src/index.js";
	import art1 from "#src/showcase/assets/image-reveal/art-1.jpg";
	import art2 from "#src/showcase/assets/image-reveal/art-2.jpg";
	import art3 from "#src/showcase/assets/image-reveal/art-3.jpg";

	// WHY: real photos served same-origin so the canvas pixel-sampling stays
	// untainted, standing in for an LLM-generated image the loader resolves into.
	const images = [art1, art2, art3];
	let reveal = $state<ImageRevealHandle>();
</script>

<div class="wrap">
	<div class="frame">
		<ImageReveal bind:this={reveal} src={images} autoReveal revealHoldMs={2200} />
	</div>
	<button type="button" class="btn" onclick={() => reveal?.triggerReveal()}>Reveal image</button>
</div>

<style>
	.wrap {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		width: 100%;
	}
	.frame {
		width: 100%;
		height: 11rem;
		border-radius: 0.75rem;
		overflow: hidden;
		border: 1px solid var(--border);
	}
	.btn {
		align-self: flex-start;
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--foreground);
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: transform 0.1s;
	}
	.btn:active {
		transform: scale(0.97);
	}
</style>
