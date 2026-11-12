<script lang="ts">
	import { FileDropZone } from "@heyramzi/ui/components/file-drop-zone";

	let files = $state<File[]>([]);
</script>

<div class="w-full max-w-md">
	<FileDropZone
		name="justificatifs"
		accept=".pdf,image/*,.csv"
		multiple
		maxFiles={4}
		maxFileSize={10 * 1024 * 1024}
		capturePaste
		bind:files
	/>
</div>
