<script lang="ts">
	import { GitBranch, MagnifyingGlass } from "phosphor-svelte";
	import * as Marker from "@heyramzi/ui/shadcn/marker";
	import { Spinner } from "@heyramzi/ui/shadcn/spinner";
</script>

<div class="flex w-full max-w-sm flex-col gap-8 py-12">
	<Marker.Root>
		<Marker.Icon>
			<GitBranch />
		</Marker.Icon>
		<Marker.Content>Switched to a new branch</Marker.Content>
	</Marker.Root>
	<Marker.Root role="status">
		<Marker.Icon>
			<Spinner />
		</Marker.Icon>
		<Marker.Content class="shimmer">Thinking...</Marker.Content>
	</Marker.Root>
	<Marker.Root variant="separator">
		<Marker.Content>Conversation compacted</Marker.Content>
	</Marker.Root>
	<Marker.Root>
		<Marker.Icon>
			<MagnifyingGlass />
		</Marker.Icon>
		<Marker.Content>Explored 4 files</Marker.Content>
	</Marker.Root>
</div>
