<script lang="ts">
	import { Slider } from "@heyramzi/ui/shadcn/slider";

	let value = $state(50);
</script>

<Slider
	type="single"
	bind:value
	max={100}
	step={1}
	thumbLabel="Volume"
	class="max-w-[70%]"
/>
