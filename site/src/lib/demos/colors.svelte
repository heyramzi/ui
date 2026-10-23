<script lang="ts">
	const groups = [
		{
			title: "Surfaces",
			tokens: ["background", "card", "popover", "muted", "secondary", "accent", "border", "input"],
		},
		{ title: "Text", tokens: ["foreground", "muted-foreground", "primary", "primary-foreground"] },
		{ title: "Brand", tokens: ["brand", "brand-highlight", "brand-signal", "brand-ink"] },
		{ title: "Status", tokens: ["success", "info", "destructive", "ring"] },
		{ title: "Charts", tokens: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] },
		{
			title: "Categories",
			tokens: [
				"cat-blue",
				"cat-teal",
				"cat-green",
				"cat-yellow",
				"cat-amber",
				"cat-orange",
				"cat-rose",
				"cat-pink",
				"cat-purple",
				"cat-indigo",
				"cat-cyan",
			],
		},
	];
</script>

<div class="flex w-full max-w-3xl flex-col gap-6">
	{#each groups as group (group.title)}
		<div>
			<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
				{group.title}
			</p>
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
				{#each group.tokens as token (token)}
					<div class="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2">
						<span
							class="size-8 shrink-0 rounded-lg border border-border"
							style="background: var(--{token}, var(--color-{token}))"
						></span>
						<code class="truncate font-mono text-xs">--{token}</code>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>
