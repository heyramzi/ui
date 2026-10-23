<script lang="ts">
	import { Mark } from "@heyramzi/ui/components/mark";
	import atelier from "#lib/demos/marks/atelier.svg?url";
	import northwind from "#lib/demos/marks/northwind.svg?url";

	const marks = [
		{ label: "Northwind Legal", src: northwind },
		{ label: "Atelier Morel", src: atelier },
		{ label: "Harbor Dental", src: "data:image/png;base64,AA==" },
		{ label: "Kestrel Surveys" },
	];
</script>

<div class="flex flex-col gap-6">
	<ul class="flex flex-col gap-2">
		{#each marks as m (m.label)}
			<li class="flex items-center gap-2 text-sm">
				<Mark src={m.src} label={m.label} />
				{m.label}
			</li>
		{/each}
	</ul>
	<div class="flex items-center gap-3">
		{#each marks as m (m.label)}
			<Mark src={m.src} label={m.label} shape="circle" class="size-9 text-sm" />
		{/each}
	</div>
</div>
