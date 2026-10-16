<script lang="ts">
	import * as Tooltip from "@heyramzi/ui/shadcn/tooltip";
	import { buttonVariants } from "@heyramzi/ui/shadcn/button";
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger class={buttonVariants({ variant: "outline" })}>Hover</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Add to library</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
