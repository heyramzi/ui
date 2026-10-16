<script lang="ts">
	import type { IconName } from "#src/core/types.js";

	let { name, small = false }: { name: IconName; small?: boolean } = $props();
</script>

<svg class="ic" class:sm={small} viewBox="0 0 24 24" aria-hidden="true" focusable="false"
	><use href="#rv-{name}" /></svg
>
