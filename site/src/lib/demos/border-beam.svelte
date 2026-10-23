<script lang="ts">
	import { Button } from "@heyramzi/ui/shadcn/button";
	import BorderBeam from "@heyramzi/ui/effects/border-beam";

	// The other presets, each a prop or two away from the default.
	const presets = [
		{
			label: "Slow sunset beam",
			props: { staticColors: true, duration: 6, colorVariant: "sunset" },
		},
		{ label: "Line ocean beam", props: { size: "line", colorVariant: "ocean" } },
		{ label: "Small mono beam", props: { size: "sm", colorVariant: "mono" } },
	] as const;
</script>

<div class="flex w-80 flex-col gap-4">
	<BorderBeam class="rounded-xl">
		<div class="flex items-center justify-between rounded-xl bg-card p-5">
			<div>
				<p class="text-sm font-medium">Border beam</p>
				<p class="text-sm text-muted-foreground">An animated edge.</p>
			</div>
			<Button variant="outline" size="sm">Try it</Button>
		</div>
	</BorderBeam>

	{#each presets as preset (preset.label)}
		<BorderBeam {...preset.props}>
			<div class="flex items-center justify-center rounded-lg bg-card px-4 py-5 text-sm">
				{preset.label}
			</div>
		</BorderBeam>
	{/each}
</div>
