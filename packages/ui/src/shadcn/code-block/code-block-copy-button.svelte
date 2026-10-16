<script lang="ts">
	import type { ComponentProps } from "svelte";
	import CopyButton from "#src/components/copy/copy-button.svelte";

	// WHY this wraps the shared control: the code block's own copy button drew a
	// second icon swap and a second clipboard write. `md` is the 28px icon Button.
	let { size = "md", ...restProps }: ComponentProps<typeof CopyButton> = $props();
</script>

<CopyButton data-slot="code-block-copy-button" {size} {...restProps} />
