<script lang="ts">
	import { ArrowRight, DownloadSimple } from "phosphor-svelte";
	import { Button } from "@heyramzi/ui/shadcn/button";
</script>

<div class="flex flex-wrap items-center justify-center gap-2">
	<Button variant="outline">
		<DownloadSimple aria-hidden="true" data-icon="inline-start" />
		Download
	</Button>
	<Button>
		Continue
		<ArrowRight aria-hidden="true" data-icon="inline-end" />
	</Button>
</div>
