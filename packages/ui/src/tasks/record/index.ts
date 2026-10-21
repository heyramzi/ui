export { default as RecordShell } from "#src/tasks/record/record-shell.svelte";
export { default as RecordHeader } from "#src/tasks/record/record-header.svelte";
export { default as WhereWeAre } from "#src/tasks/record/where-we-are.svelte";
export { default as NextUp } from "#src/tasks/record/next-up.svelte";
export { default as RecordStats } from "#src/tasks/record/record-stats.svelte";
export { default as StepsRail } from "#src/tasks/record/steps-rail.svelte";
export { default as RecordTimeline } from "#src/tasks/record/record-timeline.svelte";
export { default as ProjectList } from "#src/tasks/record/project-list.svelte";
export { default as FieldSection } from "#src/tasks/record/field-section.svelte";
export { default as InfoList } from "#src/tasks/record/info-list.svelte";

export { DEFAULT_RECORD_FILTERS, DEFAULT_RECORD_KINDS } from "#src/tasks/record/kinds.js";
export { DEFAULT_RECORD_LABELS, resolveLabels } from "#src/tasks/record/types.js";
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
} from "#src/tasks/record/logic.js";
export { fieldRow, groupFields, isFieldVisible, parseSaved, pickableOptions } from "#src/tasks/record/fields.js";
export { formatAge, formatDay, formatMoney, formatRange } from "#src/tasks/record/format.js";
export type { ClientRollup, DayGroup, LatestStatus, MoneyTotals, ProjectEvents } from "#src/tasks/record/logic.js";
export type { FieldValues } from "#src/tasks/record/fields.js";
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
} from "#src/tasks/record/types.js";
