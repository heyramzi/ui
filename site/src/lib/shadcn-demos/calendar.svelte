<script lang="ts">
	import { getLocalTimeZone, today } from "@internationalized/date";
	import { Calendar } from "@heyramzi/ui/shadcn/calendar";

	let value = today(getLocalTimeZone());
</script>

<Calendar type="single" bind:value class="rounded-md border shadow-sm" captionLayout="dropdown" />
