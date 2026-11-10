<script lang="ts">
	import { DateFormatter, getLocalTimeZone, type DateValue } from "@internationalized/date";
	import { CalendarBlank } from "phosphor-svelte";
	import * as Popover from "@heyramzi/ui/shadcn/popover";
	import { Calendar } from "@heyramzi/ui/shadcn/calendar";
	import { buttonVariants } from "@heyramzi/ui/shadcn/button";

	const format = new DateFormatter("en-GB", { dateStyle: "long" });

	let open = $state(false);
	let value = $state<DateValue>();
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class={[
			buttonVariants({ variant: "outline" }),
			"w-60 justify-start font-normal",
			!value && "text-muted-foreground",
		]}
	>
		<CalendarBlank aria-hidden="true" />
		{value ? format.format(value.toDate(getLocalTimeZone())) : "Pick a due date"}
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0" align="start">
		<Calendar
			type="single"
			bind:value
			captionLayout="dropdown"
			onValueChange={() => (open = false)}
		/>
	</Popover.Content>
</Popover.Root>
