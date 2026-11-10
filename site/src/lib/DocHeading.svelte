<script lang="ts">
	import type { Snippet } from "svelte";
	import { Hash } from "phosphor-svelte";

	// A section heading that links to itself. scroll-mt clears the sticky nav band.
	let {
		id,
		level = 2,
		class: className = "",
		children,
	}: { id: string; level?: 2 | 3; class?: string; children: Snippet } = $props();
</script>

<svelte:element
	this={level === 2 ? "h2" : "h3"}
	{id}
	class="group scroll-mt-24 {level === 2
		? 'text-xl font-semibold tracking-tight'
		: 'font-mono text-sm font-medium'} {className}"
>
	<a href="#{id}" class="inline-flex items-center gap-1.5 rounded-sm outline-offset-4">
		{@render children()}
		<Hash
			aria-hidden="true"
			class="size-[0.85em] text-muted-foreground opacity-0 transition-opacity duration-(--duration-quick) group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
		/>
	</a>
</svelte:element>
