<script lang="ts" module>
	export type TocItem = { id: string; label: string; depth?: 1 | 2 };
</script>

<script lang="ts">
	let { items }: { items: TocItem[] } = $props();

	let active = $state("");

	// The last heading above the line 30% down the viewport is the one being read.
	$effect(() => {
		const targets = items
			.map((item) => document.getElementById(item.id))
			.filter((el): el is HTMLElement => el !== null);
		if (!targets.length) return;
		const update = () => {
			const line = window.innerHeight * 0.3;
			let current = targets[0].id;
			for (const el of targets) if (el.getBoundingClientRect().top <= line) current = el.id;
			const atEnd = window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
			active = atEnd ? targets[targets.length - 1].id : current;
		};
		update();
		window.addEventListener("scroll", update, { passive: true });
		window.addEventListener("resize", update);
		return () => {
			window.removeEventListener("scroll", update);
			window.removeEventListener("resize", update);
		};
	});
</script>

<nav aria-labelledby="on-this-page" class="text-[13px]">
	<p id="on-this-page" class="mb-3 font-medium">On this page</p>
	<ul class="border-l border-border">
		{#each items as item (item.id)}
			<li>
				<a
					href="#{item.id}"
					aria-current={active === item.id ? "location" : undefined}
					class="-ml-px block border-l border-transparent py-1 text-muted-foreground transition-colors duration-(--duration-quick) hover:text-foreground aria-[current]:border-foreground aria-[current]:text-foreground {item.depth ===
					2
						? 'pl-6 font-mono text-xs'
						: 'pl-3'}"
				>
					{item.label}
				</a>
			</li>
		{/each}
	</ul>
</nav>
