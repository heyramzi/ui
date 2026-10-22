<script lang="ts">
	// Renders a drawing kept in its own .svg file, imported with `?raw`.
	// The markup is ours and static, so rendering it as HTML is safe.
	let { src, class: className = "" }: { src: string; class?: string } = $props();

	const markup = $derived(className ? src.replace("<svg", `<svg class="${className}"`) : src);
</script>

{@html markup}
