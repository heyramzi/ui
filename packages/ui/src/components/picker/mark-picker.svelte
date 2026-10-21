<script lang="ts" generics="V extends string">
// =========================
// IMPORTS
// =========================
import { CaretDown } from "phosphor-svelte";
import { Mark } from "#src/components/mark/index.js";
import { cn } from "#src/lib/utils.js";
import Picker from "#src/components/picker/picker.svelte";
import { pickerTriggerClass } from "#src/components/picker/trigger.js";
import type { PickerOption } from "#src/components/picker/types.js";

// =========================
// TYPES
// =========================

/**
 * The picker for named things carrying a mark: a kit, a channel, a client. It
 * wraps `Picker` because the kit strip and the channel row wrote the same two
 * snippets.
 */
interface Props {
	options: PickerOption<V>[];
	value: V | null;
	onSelect: (value: V) => void;
	ariaLabel: string;
	/** Said by the trigger when nothing in the list is the current value. */
	placeholder?: string;
	/** The search field's own prompt, on a list long enough to show one. */
	searchPlaceholder?: string;
	/** `circle` for a face or an avatar, `square` for a logo. */
	shape?: "square" | "circle";
	width?: "sm" | "default" | "lg";
	class?: string;
};

// =========================
// PROPS
// =========================
let {
	options,
	value,
	onSelect,
	ariaLabel,
	placeholder = "Select",
	searchPlaceholder = "Search",
	shape = "square",
	width = "lg",
	class: className,
}: Props = $props();

// =========================
// DERIVED
// =========================
let selected = $derived(options.find((option) => option.value === value));
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<Picker
	{options}
	{value}
	{onSelect}
	{width}
	{searchPlaceholder}
	triggerClass={cn(pickerTriggerClass(), className)}
	triggerLabel={ariaLabel}
>
	{#snippet trigger()}
		{#if selected?.image}
			<Mark src={selected.image} label={selected.label} {shape} />
		{:else if selected?.icon}
			{@const Icon = selected.icon}
			<Icon class="text-muted-foreground size-4" />
		{/if}
		<span class="truncate">{selected?.label ?? placeholder}</span>
		<CaretDown class="text-muted-foreground size-3" />
	{/snippet}
	<!-- A row with an icon of its own is drawn by `Picker`; this is every other
	     row, the ones that carry a mark. -->
	{#snippet lead(option)}
		<Mark src={option.image} label={option.label} {shape} />
	{/snippet}
</Picker>
