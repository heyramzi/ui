<script lang="ts">
	import { type ChartConfig, THEMES } from "#src/primitives/chart-utils.js";

	let { id, config }: { id: string; config: ChartConfig } = $props();

	const colorConfig = $derived(
		config ? Object.entries(config).filter(([, c]) => c.theme || c.color) : null,
	);

	const themeContents = $derived.by(() => {
		if (!colorConfig || !colorConfig.length) return;

		const blocks: string[] = [];
		for (const [_theme, prefix] of Object.entries(THEMES)) {
			let content = `${prefix} [data-chart=${id}] {\n`;
			const color = colorConfig.map(([key, itemConfig]) => {
				const theme = _theme as keyof typeof itemConfig.theme;
				const value = itemConfig.theme?.[theme] || itemConfig.color;
				return value ? `\t--color-${key}: ${value};` : null;
			});

			content += `${color.join("\n")}\n}`;
			blocks.push(content);
		}

		return blocks.join("\n");
	});
</script>

{#if themeContents}
	{#key id}
		<svelte:element this={"style"}>
			{themeContents}
		</svelte:element>
	{/key}
{/if}
