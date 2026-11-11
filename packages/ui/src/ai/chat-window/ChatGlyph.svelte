<script lang="ts">
	// =========================
	// PROPS
	// =========================
	interface Props {
		/** The SVG file's URL, painted through a mask in the current colour. */
		src: string;
		size?: number;
		class?: string;
	}

	let { src, size = 20, class: className = "" }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<span
	class="chat-glyph {className}"
	style:--glyph={`url("${src}")`}
	style:--size="{size}px"
	aria-hidden="true"
></span>

<style>
	@layer theme, base, components, utilities;

	@layer components {
		.chat-glyph {
			display: block;
			flex: none;
			width: var(--size);
			height: var(--size);
			background: currentColor;
			mask: var(--glyph) center / contain no-repeat;
		}
	}
</style>
