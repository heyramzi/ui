<script lang="ts">
	let { size = 16, class: className }: { size?: number; class?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" class={className}>
	<g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
		<line x1="6" y1="4" x2="14" y2="4"></line>
		<line x1="6" y1="8" x2="14" y2="8"></line>
		<line x1="6" y1="12" x2="14" y2="12"></line>
	</g>
	<g fill="currentColor">
		<circle cx="2.75" cy="4" r="1"></circle>
		<circle cx="2.75" cy="8" r="1"></circle>
		<circle cx="2.75" cy="12" r="1"></circle>
	</g>
</svg>
