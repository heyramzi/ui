export { default as RecordShell } from "#src/record/record-shell.svelte";
export { default as RecordHeader } from "#src/record/record-header.svelte";
export { default as WhereWeAre } from "#src/record/where-we-are.svelte";
export { default as NextUp } from "#src/record/next-up.svelte";
export { default as RecordStats } from "#src/record/record-stats.svelte";
export { default as StepsRail } from "#src/record/steps-rail.svelte";
export { default as RecordTimeline } from "#src/record/record-timeline.svelte";
export { default as ProjectList } from "#src/record/project-list.svelte";
export { default as FieldSection } from "#src/record/field-section.svelte";
export { default as InfoList } from "#src/record/info-list.svelte";

export { DEFAULT_RECORD_FILTERS, DEFAULT_RECORD_KINDS } from "#src/record/kinds.js";
export { DEFAULT_RECORD_LABELS, resolveLabels } from "#src/record/types.js";
export {
	activeProjects,
	dayRelation,
	eventsForFilter,
	filterCounts,
	foldGroups,
	groupEventsByDay,
	groupSteps,
	latestWhereWeAre,
	localDay,
	mergeClientEvents,
	nextAcrossProjects,
	nudgeStep,
	reorderIds,
	rollupProjects,
	stepMarkers,
	stepProgress,
} from "#src/record/logic.js";
export { fieldRow, groupFields, isFieldVisible, parseSaved, pickableOptions } from "#src/record/fields.js";
export { formatAge, formatDay, formatMoney, formatRange } from "#src/record/format.js";
export type { ClientRollup, DayGroup, LatestStatus, MoneyTotals, ProjectEvents } from "#src/record/logic.js";
export type { FieldValues } from "#src/record/fields.js";
export type {
	FieldDef,
	FieldOption,
	FieldSectionDef,
	FieldType,
	FieldValue,
	InfoRow,
	RecordEvent,
	RecordFilterDef,
	RecordKindDef,
	RecordLabels,
	RecordNext,
	RecordSummary,
	StageCategory,
	StageDef,
	StepDef,
	StepGroupDef,
	StepMarker,
} from "#src/record/types.js";
