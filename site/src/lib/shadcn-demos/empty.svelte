<script lang="ts">
	import { ArrowUpRight, FolderOpen } from "phosphor-svelte";
	import * as Empty from "@heyramzi/ui/shadcn/empty";
	import { Button } from "@heyramzi/ui/shadcn/button";
</script>

<Empty.Root>
	<Empty.Header>
		<Empty.Media variant="icon">
			<FolderOpen />
		</Empty.Media>
		<Empty.Title>No Projects Yet</Empty.Title>
		<Empty.Description>
			You haven't created any projects yet. Get started by creating your first project.
		</Empty.Description>
	</Empty.Header>
	<Empty.Content>
		<div class="flex gap-2">
			<Button>Create Project</Button>
			<Button variant="outline">Import Project</Button>
		</div>
	</Empty.Content>
	<Button variant="ghost" class="text-muted-foreground" size="sm">
		<a href="#/">
			Learn More <ArrowUpRight class="inline" />
		</a>
	</Button>
</Empty.Root>
