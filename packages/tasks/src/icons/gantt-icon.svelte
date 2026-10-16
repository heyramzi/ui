<script lang="ts">
	let { size = 16, class: className }: { size?: number; class?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" class={className}>
	<g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
		<line x1="2" y1="4" x2="8" y2="4"></line>
		<line x1="5" y1="8" x2="12" y2="8"></line>
		<line x1="9" y1="12" x2="14" y2="12"></line>
	</g>
</svg>
