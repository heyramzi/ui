<script lang="ts">
	import { TextB, TextItalic, TextUnderline } from "phosphor-svelte";
	import * as ToggleGroup from "@heyramzi/ui/shadcn/toggle-group";
</script>

<ToggleGroup.Root variant="outline" type="multiple">
	<ToggleGroup.Item value="bold" aria-label="Toggle bold">
		<TextB class="h-4 w-4" />
	</ToggleGroup.Item>
	<ToggleGroup.Item value="italic" aria-label="Toggle italic">
		<TextItalic class="h-4 w-4" />
	</ToggleGroup.Item>
	<ToggleGroup.Item value="strikethrough" aria-label="Toggle strikethrough">
		<TextUnderline class="h-4 w-4" />
	</ToggleGroup.Item>
</ToggleGroup.Root>
