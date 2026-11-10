<script lang="ts">
	import * as NativeSelect from "@heyramzi/ui/shadcn/native-select";

	let status = $state("todo");
</script>

<div class="flex flex-col items-center gap-4">
	<NativeSelect.Root bind:value={status} aria-label="Status" class="w-45">
		<NativeSelect.Option value="todo">To do</NativeSelect.Option>
		<NativeSelect.Option value="doing">In progress</NativeSelect.Option>
		<NativeSelect.Option value="done">Done</NativeSelect.Option>
	</NativeSelect.Root>

	<NativeSelect.Root size="sm" aria-label="Country" class="w-45">
		<NativeSelect.OptGroup label="Europe">
			<NativeSelect.Option value="fr">France</NativeSelect.Option>
			<NativeSelect.Option value="pt">Portugal</NativeSelect.Option>
		</NativeSelect.OptGroup>
		<NativeSelect.OptGroup label="Americas">
			<NativeSelect.Option value="us">United States</NativeSelect.Option>
			<NativeSelect.Option value="br">Brazil</NativeSelect.Option>
		</NativeSelect.OptGroup>
	</NativeSelect.Root>
</div>
