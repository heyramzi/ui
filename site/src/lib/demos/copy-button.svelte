<script lang="ts">
	import { CopyButton } from "@heyramzi/ui/components/copy";
</script>

<div class="flex items-center gap-4">
	<CopyButton value="pnpm add @heyramzi/ui" label="Copy install command" />
	<CopyButton value="acme-4821" text="acme-4821" label="Copy id" />
</div>

<p class="mt-6 text-sm">
	Codes in running text, such as
	<CopyButton
		value="26011200"
		text="26011200"
		label="Copy CN code 26011200"
		copiedLabel="CN code 26011200 copied"
		variant="inline"
		announce="name"
	/>, copy on click.
</p>
