<script lang="ts">
	import { BookmarkSimple } from "phosphor-svelte";
	import { Toggle } from "@heyramzi/ui/shadcn/toggle";
</script>

<Toggle
	aria-label="Toggle bookmark"
	size="sm"
	variant="outline"
	class="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-blue-500 data-[state=on]:*:[svg]:stroke-blue-500"
>
	<BookmarkSimple />
	Bookmark
</Toggle>
