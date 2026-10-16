<script lang="ts">
	let { size = 16, class: className }: { size?: number; class?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" class={className}>
	<g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
		<line x1="4" y1="3" x2="4" y2="11"></line>
		<line x1="8" y1="3" x2="8" y2="7.5"></line>
		<line x1="12" y1="3" x2="12" y2="13"></line>
	</g>
</svg>
