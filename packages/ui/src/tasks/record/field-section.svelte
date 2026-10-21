<script lang="ts">
// =========================
// IMPORTS
// =========================
import { cn } from "#src/lib/utils.js";
import { fieldRow, groupFields, type FieldValues } from "#src/tasks/record/fields.js";
import InfoList from "#src/tasks/record/info-list.svelte";
import type {
	FieldDef,
	FieldSectionDef,
	FieldValue,
	RecordLabels,
} from "#src/tasks/record/types.js";

// =========================
// PROPS
// =========================
interface Props {
	/** What a module declares for this record. */
	fields: FieldDef[];
	/** Section headings in the order to draw them. A section with no field isn't drawn. */
	sections?: FieldSectionDef[];
	values: FieldValues;
	/** Without it every field is read-only and an empty one is left out. */
	onSave?: (key: string, value: FieldValue) => void | Promise<void>;
	/** For a money field that names none. */
	currency?: string;
	labels?: Partial<RecordLabels>;
	locale?: string;
	class?: string;
}
let { fields, sections = [], values, onSave, currency, labels, locale, class: className }: Props = $props();

// =========================
// DERIVED
// =========================
let groups = $derived(groupFields(fields, sections, values));
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if groups.length > 0}
	<div class={cn("flex flex-col gap-5", className)}>
		{#each groups as group (group.key)}
			<InfoList
				title={group.label}
				{labels}
				rows={group.fields.map((f) => fieldRow(f, values[f.key], { locale, currency, onSave }))}
			/>
		{/each}
	</div>
{/if}
