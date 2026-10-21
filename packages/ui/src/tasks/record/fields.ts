// Turns a module's field declarations and a record's values into rows to draw.
import { formatDay, formatMoney } from "#src/tasks/record/format.js";
import type {
	FieldDef,
	FieldOption,
	FieldSectionDef,
	FieldValue,
	InfoRow,
} from "#src/tasks/record/types.js";

export type FieldValues = Record<string, FieldValue | undefined>;

function isEmpty(value: FieldValue | undefined): boolean {
	return value == null || value === "" || (Array.isArray(value) && value.length === 0);
}

/** A field shows unless its `showWhen` names a field that doesn't hold the wanted value. */
export function isFieldVisible(field: FieldDef, values: FieldValues): boolean {
	const rule = field.showWhen;
	if (!rule) return true;
	const current = values[rule.key];
	if (rule.equals === undefined) return !isEmpty(current);
	const wanted = Array.isArray(rule.equals) ? rule.equals : [rule.equals];
	const held = Array.isArray(current) ? current : current == null ? [] : [String(current)];
	return held.some((v) => wanted.includes(v));
}

/**
 * The options a picker offers: an archived one is left out unless it is what the
 * record already holds, so an old value still reads and is never chosen again.
 */
export function pickableOptions(field: FieldDef, value: FieldValue | undefined): FieldOption[] {
	const held = Array.isArray(value) ? value : value == null ? [] : [String(value)];
	return (field.options ?? []).filter((o) => !o.archived || held.includes(o.key));
}

export type FieldGroup = { key: string; label: string | null; fields: FieldDef[] };

/**
 * Visible fields bucketed by section in the declared order. A section with no
 * field is not drawn. Fields with no or an unknown section go last under no heading.
 */
export function groupFields(
	fields: readonly FieldDef[],
	sections: readonly FieldSectionDef[],
	values: FieldValues,
): FieldGroup[] {
	const visible = fields.filter((f) => isFieldVisible(f, values));
	const known = new Set(sections.map((s) => s.key));
	const groups: FieldGroup[] = sections
		.map((s) => ({ key: s.key, label: s.label as string | null, fields: visible.filter((f) => f.section === s.key) }))
		.filter((g) => g.fields.length > 0);
	const loose = visible.filter((f) => !f.section || !known.has(f.section));
	if (loose.length > 0) groups.push({ key: "", label: null, fields: loose });
	return groups;
}

/** What the editor hands back, as the type the field declares. Empty text is null. */
export function parseSaved(field: FieldDef, raw: string | string[]): FieldValue {
	if (Array.isArray(raw)) return raw;
	const text = raw.trim();
	if (text === "") return null;
	if (field.type === "money") {
		const n = Number(text.replace(",", "."));
		return Number.isFinite(n) ? n : null;
	}
	return text;
}

export type RowContext = {
	locale?: string;
	/** The record's currency, for a money field with none of its own. */
	currency?: string;
	onSave?: (key: string, value: FieldValue) => void | Promise<void>;
};

const INPUT: Record<FieldDef["type"], NonNullable<InfoRow["input"]>> = {
	text: "text",
	longtext: "longtext",
	choice: "select",
	multi: "multi",
	money: "number",
	date: "date",
	url: "url",
	email: "email",
	timezone: "text",
};

/** One field and its value as an `InfoRow`. */
export function fieldRow(field: FieldDef, value: FieldValue | undefined, ctx: RowContext = {}): InfoRow {
	const row: InfoRow = {
		id: field.key,
		label: field.label,
		input: INPUT[field.type],
		placeholder: field.placeholder,
		required: field.required,
	};
	const optionOf = (key: string) => field.options?.find((o) => o.key === key);

	if (!isEmpty(value)) {
		switch (field.type) {
			case "choice": {
				const option = optionOf(String(value));
				row.value = option?.label ?? String(value);
				row.tone = option?.tone;
				break;
			}
			case "multi": {
				const keys = Array.isArray(value) ? value : [String(value)];
				row.chips = keys.map((k) => ({ label: optionOf(k)?.label ?? k, tone: optionOf(k)?.tone }));
				break;
			}
			case "money":
				row.value = formatMoney(Number(value), field.currency ?? ctx.currency, ctx.locale);
				break;
			case "date":
				row.value = formatDay(String(value), ctx.locale);
				break;
			case "url":
				row.value = String(value).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
				row.href = String(value);
				break;
			case "email":
				row.value = String(value);
				row.href = `mailto:${value}`;
				break;
			default:
				row.value = String(value);
		}
	}

	if (field.type === "choice" || field.type === "multi") {
		row.options = pickableOptions(field, value).map((o) => ({ value: o.key, label: o.label, tone: o.tone }));
		row.editValue = Array.isArray(value) ? value : value == null ? (field.type === "multi" ? [] : "") : String(value);
	} else if (!isEmpty(value)) {
		row.editValue = String(value);
	}

	const onSave = ctx.onSave;
	if (onSave) row.onSave = (raw) => onSave(field.key, parseSaved(field, raw));
	return row;
}
