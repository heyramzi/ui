<script lang="ts">
	let { size = 16, class: className }: { size?: number; class?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" class={className}>
	<rect x="2" y="2.5" width="3.5" height="11" rx="1.25" stroke="currentColor" stroke-width="1.5"></rect>
	<rect x="7" y="2.5" width="3.5" height="7" rx="1.25" stroke="currentColor" stroke-width="1.5"></rect>
	<rect x="12" y="2.5" width="2" height="9" rx="1" stroke="currentColor" stroke-width="1.5"></rect>
</svg>
