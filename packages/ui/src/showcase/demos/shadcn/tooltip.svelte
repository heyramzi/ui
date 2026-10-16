<script lang="ts">
	import * as Tooltip from "#src/shadcn/tooltip/index.js";
	import { buttonVariants } from "#src/shadcn/button/index.js";
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger class={buttonVariants({ variant: "outline" })}>Hover</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Add to library</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
