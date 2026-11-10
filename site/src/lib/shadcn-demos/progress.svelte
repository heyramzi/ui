<script lang="ts">
	import { onMount } from "svelte";
	import { Progress } from "@heyramzi/ui/shadcn/progress";

	let value = $state(13);

	onMount(() => {
		const timer = setTimeout(() => (value = 66), 500);
		return () => clearTimeout(timer);
	});
</script>

<Progress {value} max={100} aria-label="Upload" class="w-[60%]" />
