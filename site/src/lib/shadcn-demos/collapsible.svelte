<script lang="ts">
	import { CaretUpDown } from "phosphor-svelte";
	import * as Collapsible from "@heyramzi/ui/shadcn/collapsible";
	import { buttonVariants } from "@heyramzi/ui/shadcn/button";
</script>

<Collapsible.Root class="w-[350px] space-y-2">
	<div class="flex items-center justify-between space-x-4 px-4">
		<h4 class="text-sm font-semibold">@huntabyte starred 3 repositories</h4>
		<Collapsible.Trigger class={buttonVariants({ variant: "ghost", size: "sm", class: "w-9 p-0" })}>
			<CaretUpDown />
			<span class="sr-only">Toggle</span>
		</Collapsible.Trigger>
	</div>
	<div class="rounded-md border px-4 py-3 font-mono text-sm">@huntabyte/bits-ui</div>
	<Collapsible.Content class="space-y-2">
		<div class="rounded-md border px-4 py-3 font-mono text-sm">@melt-ui/melt-ui</div>
		<div class="rounded-md border px-4 py-3 font-mono text-sm">@sveltejs/svelte</div>
	</Collapsible.Content>
</Collapsible.Root>
