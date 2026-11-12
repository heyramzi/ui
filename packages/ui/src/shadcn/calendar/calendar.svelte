<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import CalendarCaption from "#src/shadcn/calendar/calendar-caption.svelte";
	import CalendarCell from "#src/shadcn/calendar/calendar-cell.svelte";
	import CalendarDay from "#src/shadcn/calendar/calendar-day.svelte";
	import CalendarGridBody from "#src/shadcn/calendar/calendar-grid-body.svelte";
	import CalendarGridHead from "#src/shadcn/calendar/calendar-grid-head.svelte";
	import CalendarGridRow from "#src/shadcn/calendar/calendar-grid-row.svelte";
	import CalendarGrid from "#src/shadcn/calendar/calendar-grid.svelte";
	import CalendarHeadCell from "#src/shadcn/calendar/calendar-head-cell.svelte";
	import CalendarHeader from "#src/shadcn/calendar/calendar-header.svelte";
	import CalendarMonth from "#src/shadcn/calendar/calendar-month.svelte";
	import CalendarMonths from "#src/shadcn/calendar/calendar-months.svelte";
	import CalendarNav from "#src/shadcn/calendar/calendar-nav.svelte";
	import CalendarNextButton from "#src/shadcn/calendar/calendar-next-button.svelte";
	import CalendarPrevButton from "#src/shadcn/calendar/calendar-prev-button.svelte";
	import { cn, type WithoutChildrenOrChild } from "#src/lib/utils.js";
	import type { ButtonVariant } from "#src/shadcn/button/button.svelte";
	import { isEqualMonth, type DateValue } from "@internationalized/date";
	import type { Snippet } from "svelte";

	let {
		ref = $bindable(null),
		value = $bindable(),
		placeholder = $bindable(),
		class: className,
		weekdayFormat = "short",
		buttonVariant = "ghost",
		captionLayout = "label",
		locale = "en-US",
		months: monthsProp,
		years,
		monthFormat: monthFormatProp,
		yearFormat = "numeric",
		day,
		disableDaysOutsideMonth = false,
		// Monday first and six rows always: a five-week month would otherwise resize
		// the popover as the reader pages through the year.
		weekStartsOn = 1,
		fixedWeeks = true,
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.RootProps> & {
		buttonVariant?: ButtonVariant;
		captionLayout?: "dropdown" | "dropdown-months" | "dropdown-years" | "label";
		months?: CalendarPrimitive.MonthSelectProps["months"];
		years?: CalendarPrimitive.YearSelectProps["years"];
		monthFormat?: CalendarPrimitive.MonthSelectProps["monthFormat"];
		yearFormat?: CalendarPrimitive.YearSelectProps["yearFormat"];
		day?: Snippet<[{ day: DateValue; outsideMonth: boolean }]>;
	} = $props();

	const monthFormat = $derived.by(() => {
		if (monthFormatProp) return monthFormatProp;
		if (captionLayout.startsWith("dropdown")) return "short";
		return "long";
	});
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<CalendarPrimitive.Root
	bind:value={value as never}
	bind:ref
	bind:placeholder
	{weekdayFormat}
	{disableDaysOutsideMonth}
	{weekStartsOn}
	{fixedWeeks}
	class={cn(
		"bg-card group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
		className,
	)}
	{locale}
	{monthFormat}
	{yearFormat}
	{...restProps}
>
	{#snippet children({ months, weekdays })}
		<CalendarMonths>
			<CalendarNav>
				<CalendarPrevButton variant={buttonVariant} />
				<CalendarNextButton variant={buttonVariant} />
			</CalendarNav>
			{#each months as month, monthIndex (month)}
				<CalendarMonth>
					<CalendarHeader>
						<CalendarCaption
							{captionLayout}
							months={monthsProp}
							{monthFormat}
							{years}
							{yearFormat}
							month={month.value}
							bind:placeholder
							{locale}
							{monthIndex}
						/>
					</CalendarHeader>
					<CalendarGrid>
						<CalendarGridHead>
							<CalendarGridRow class="select-none">
								{#each weekdays as weekday (weekday)}
									<CalendarHeadCell>
										{weekday.slice(0, 2)}
									</CalendarHeadCell>
								{/each}
							</CalendarGridRow>
						</CalendarGridHead>
						<CalendarGridBody>
							{#each month.weeks as weekDates (weekDates)}
								<CalendarGridRow class="mt-2 w-full">
									{#each weekDates as date (date)}
										<CalendarCell {date} month={month.value}>
											{#if day}
												{@render day({
													day: date,
													outsideMonth: !isEqualMonth(date, month.value),
												})}
											{:else}
												<CalendarDay />
											{/if}
										</CalendarCell>
									{/each}
								</CalendarGridRow>
							{/each}
						</CalendarGridBody>
					</CalendarGrid>
				</CalendarMonth>
			{/each}
		</CalendarMonths>
	{/snippet}
</CalendarPrimitive.Root>
