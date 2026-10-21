import { describe, expect, it } from "vite-plus/test";
import {
	activeProjects,
	dayRelation,
	eventsForFilter,
	filterCounts,
	foldGroups,
	groupEventsByDay,
	groupSteps,
	latestWhereWeAre,
	mergeClientEvents,
	nextAcrossProjects,
	nudgeStep,
	reorderIds,
	rollupProjects,
	stepMarkers,
	stepProgress,
} from "#src/tasks/record/logic.js";
import { formatRange } from "#src/tasks/record/format.js";
import { fieldRow, groupFields, isFieldVisible, parseSaved, pickableOptions } from "#src/tasks/record/fields.js";
import type { FieldDef, RecordEvent, RecordSummary, StageDef, StepDef } from "#src/tasks/record/types.js";

const ev = (id: string, kind: string, occurredAt: string): RecordEvent => ({
	id,
	kind,
	occurredAt,
	title: id,
});

const stages: StageDef[] = [
	{ key: "lead", label: "Lead", tone: "neutral", category: "open" },
	{ key: "sent", label: "Proposal sent", tone: "info", category: "proposal" },
	{ key: "build", label: "In build", tone: "accent", category: "ongoing" },
	{ key: "paid", label: "Paid", tone: "success", category: "completed" },
	{ key: "lost", label: "Lost", tone: "destructive", category: "lost" },
];

const project = (over: Partial<RecordSummary> & { id: string }): RecordSummary => ({
	name: over.id,
	stageKey: "lead",
	...over,
});

describe("groupEventsByDay", () => {
	it("groups by calendar day, newest day and newest event first", () => {
		const groups = groupEventsByDay(
			[
				ev("a", "note", "2026-10-20T09:00:00Z"),
				ev("b", "call", "2026-10-21T08:00:00Z"),
				ev("c", "note", "2026-10-21T16:00:00Z"),
			],
			"UTC",
		);
		expect(groups.map((g) => g.day)).toEqual(["2026-10-21", "2026-10-20"]);
		expect(groups[0]?.events.map((e) => e.id)).toEqual(["c", "b"]);
	});

	it("reads the day in the given zone, so late evening UTC is tomorrow in Tokyo", () => {
		const events = [ev("a", "note", "2026-10-21T20:00:00Z")];
		expect(groupEventsByDay(events, "UTC")[0]?.day).toBe("2026-10-21");
		expect(groupEventsByDay(events, "Asia/Tokyo")[0]?.day).toBe("2026-10-22");
	});

	it("returns nothing for no events and does not mutate its input", () => {
		expect(groupEventsByDay([], "UTC")).toEqual([]);
		const input = [ev("a", "note", "2026-10-20T09:00:00Z"), ev("b", "note", "2026-10-21T09:00:00Z")];
		groupEventsByDay(input, "UTC");
		expect(input.map((e) => e.id)).toEqual(["a", "b"]);
	});
});

describe("dayRelation", () => {
	it("says today, yesterday, or date", () => {
		expect(dayRelation("2026-10-21", "2026-10-21")).toBe("today");
		expect(dayRelation("2026-10-20", "2026-10-21")).toBe("yesterday");
		expect(dayRelation("2026-10-19", "2026-10-21")).toBe("date");
		expect(dayRelation("2026-09-30", "2026-10-01")).toBe("yesterday");
	});
});

describe("filters", () => {
	const filters = [
		{ key: "calls", label: "Calls", kinds: ["call", "meeting"] },
		{ key: "notes", label: "Notes", kinds: ["note"] },
	];
	const events = [ev("a", "call", "2026-10-21T08:00:00Z"), ev("b", "note", "2026-10-21T09:00:00Z"), ev("c", "x:custom", "2026-10-21T10:00:00Z")];

	it("keeps only the kinds of the chosen chip", () => {
		expect(eventsForFilter(events, "calls", filters).map((e) => e.id)).toEqual(["a"]);
	});
	it("shows everything for all or an unknown key", () => {
		expect(eventsForFilter(events, "all", filters)).toHaveLength(3);
		expect(eventsForFilter(events, "nope", filters)).toHaveLength(3);
	});
	it("counts per chip", () => {
		expect(filterCounts(events, filters)).toEqual({ calls: 1, notes: 1 });
	});
});

describe("foldGroups", () => {
	const groups = groupEventsByDay(
		[
			ev("a", "note", "2026-10-21T09:00:00Z"),
			ev("b", "note", "2026-10-21T08:00:00Z"),
			ev("c", "note", "2026-10-20T08:00:00Z"),
			ev("d", "note", "2026-10-19T08:00:00Z"),
		],
		"UTC",
	);
	it("cuts inside a day when the limit falls there and counts the rest", () => {
		const folded = foldGroups(groups, 1);
		expect(folded.groups.map((g) => g.events.length)).toEqual([1]);
		expect(folded.hidden).toBe(3);
	});
	it("hides nothing when the limit covers it", () => {
		expect(foldGroups(groups, 10)).toEqual({ groups, hidden: 0 });
	});
	it("spans days up to the limit", () => {
		const folded = foldGroups(groups, 3);
		expect(folded.groups.map((g) => g.day)).toEqual(["2026-10-21", "2026-10-20"]);
		expect(folded.hidden).toBe(1);
	});
});

describe("mergeClientEvents", () => {
	it("tags project events with their project and keeps client events untagged", () => {
		const merged = mergeClientEvents(
			[ev("form", "form", "2026-10-01T10:00:00Z")],
			[
				{ id: "p1", name: "Website", href: "/p/1", events: [ev("a", "call", "2026-10-03T10:00:00Z")] },
				{ id: "p2", name: "Retainer", events: [ev("b", "note", "2026-10-02T10:00:00Z")] },
			],
		);
		expect(merged.map((e) => e.id)).toEqual(["a", "b", "form"]);
		expect(merged[0]).toMatchObject({ projectId: "p1", projectName: "Website", projectHref: "/p/1" });
		expect(merged[1]).toMatchObject({ projectId: "p2", projectHref: null });
		expect(merged[2]).toMatchObject({ projectId: null, projectName: null });
	});

	it("draws an id seen twice once", () => {
		const shared = ev("same", "call", "2026-10-03T10:00:00Z");
		const merged = mergeClientEvents([shared], [{ id: "p1", name: "Website", events: [shared] }]);
		expect(merged).toHaveLength(1);
		expect(merged[0]?.projectId).toBe("p1");
	});

	it("handles a client with no projects", () => {
		expect(mergeClientEvents([ev("a", "note", "2026-10-03T10:00:00Z")], [])).toHaveLength(1);
		expect(mergeClientEvents([], [])).toEqual([]);
	});
});

describe("client rollup", () => {
	const projects = [
		project({ id: "lost", stageKey: "lost", value: 9000, lastCallAt: "2026-09-01T10:00:00Z" }),
		project({ id: "paid", stageKey: "paid", value: 12000, paid: 12000, lastCallAt: "2026-10-10T10:00:00Z" }),
		project({ id: "live", stageKey: "sent", value: 8000, next: { label: "Kickoff", date: "2026-10-26" }, whereWeAre: { text: "Waiting on legal", at: "2026-10-18T10:00:00Z" } }),
		project({ id: "late", stageKey: "build", value: 5000, paid: 1000, next: { label: "Review", date: "2026-10-23" }, whereWeAre: { text: "Building", at: "2026-10-20T10:00:00Z" } }),
		project({ id: "closed", stageKey: "build", closed: true, next: { label: "Old", date: "2026-10-01" } }),
	];

	it("counts a lost project in no total and sums each currency apart", () => {
		const rollup = rollupProjects(
			[...projects, project({ id: "usd", stageKey: "lead", value: 700, currency: "USD" })],
			stages,
		);
		expect(rollup.totals.EUR).toEqual({ pipeline: 8000, won: 17000, paid: 13000 });
		expect(rollup.totals.USD).toEqual({ pipeline: 700, won: 0, paid: 0 });
		expect(rollup.count).toBe(6);
		expect(rollup.lastCallAt).toBe("2026-10-10T10:00:00Z");
	});

	it("keeps lost, completed and closed out of the active list", () => {
		expect(activeProjects(projects, stages).map((p) => p.id)).toEqual(["live", "late"]);
	});

	it("picks the earliest dated next across active projects, skipping closed ones", () => {
		expect(nextAcrossProjects(projects, stages)).toMatchObject({ label: "Review", projectName: "late" });
	});

	it("puts a dated next ahead of an undated one", () => {
		const next = nextAcrossProjects(
			[
				project({ id: "a", next: { label: "Someday" } }),
				project({ id: "b", next: { label: "Dated", date: "2027-01-01" } }),
			],
			stages,
		);
		expect(next?.label).toBe("Dated");
	});

	it("returns null when nothing is next", () => {
		expect(nextAcrossProjects([project({ id: "a" })], stages)).toBeNull();
		expect(nextAcrossProjects([], stages)).toBeNull();
	});

	it("takes the newest where-we-are, even from a closed project", () => {
		expect(latestWhereWeAre(projects)).toMatchObject({ text: "Building", projectName: "late" });
		expect(latestWhereWeAre([project({ id: "a" })])).toBeNull();
	});
});

describe("steps", () => {
	const step = (id: string, over: Partial<StepDef> = {}): StepDef => ({ id, label: id, done: false, ...over });

	it("marks done, the first open one current, earlier-skipped and overdue ones late", () => {
		const steps = [
			step("a", { done: true }),
			step("b"),
			step("c", { end: "2026-10-01" }),
			step("d", { start: "2026-12-01" }),
			step("e"),
		];
		const m = stepMarkers(steps, "2026-10-21");
		expect([...m.entries()]).toEqual([
			["a", "complete"],
			["b", "current"],
			["c", "late"],
			["d", "pending"],
			["e", "pending"],
		]);
	});

	it("calls an open step before the current one late, when an earlier one is open but out of order", () => {
		// c done, b open: b is current (first open), nothing before it is open.
		const m = stepMarkers([step("a", { hidden: true }), step("b"), step("c", { done: true })], "2026-10-21");
		expect(m.has("a")).toBe(false);
		expect(m.get("b")).toBe("current");
		expect(m.get("c")).toBe("complete");
	});

	it("has no current step when all are done", () => {
		const m = stepMarkers([step("a", { done: true })], "2026-10-21");
		expect([...m.values()]).toEqual(["complete"]);
	});

	it("counts progress over visible steps only", () => {
		expect(stepProgress([step("a", { done: true }), step("b"), step("c", { hidden: true, done: true })])).toEqual({ done: 1, total: 2 });
	});

	it("buckets by group in declared order and puts ungrouped steps last, headerless", () => {
		const buckets = groupSteps(
			[step("a", { group: "delivery" }), step("b", { group: "sales" }), step("c"), step("d", { group: "delivery" }), step("e", { group: "gone" })],
			[
				{ key: "sales", label: "Sales" },
				{ key: "delivery", label: "Delivery" },
				{ key: "empty", label: "Empty" },
			],
		);
		expect(buckets.map((b) => [b.key, b.steps.map((s) => s.id)])).toEqual([
			["sales", ["b"]],
			["delivery", ["a", "d"]],
			["", ["c", "e"]],
		]);
		expect(buckets[2]?.label).toBeNull();
	});

	it("reorders before or after a target and leaves the list on a no-op", () => {
		const ids = ["a", "b", "c", "d"];
		expect(reorderIds(ids, "d", "b", true)).toEqual(["a", "d", "b", "c"]);
		expect(reorderIds(ids, "a", "c", false)).toEqual(["b", "c", "a", "d"]);
		expect(reorderIds(ids, "a", "a", true)).toEqual(ids);
		expect(reorderIds(ids, "zz", "a", true)).toEqual(ids);
		expect(reorderIds(ids, "a", "zz", true)).toEqual(ids);
	});

	it("nudges within a group and stops at its edge", () => {
		const steps = [step("a", { group: "s" }), step("x", { group: "t" }), step("b", { group: "s" })];
		expect(nudgeStep(steps, "a", 1)).toEqual(["b", "x", "a"]);
		expect(nudgeStep(steps, "a", -1)).toEqual(["a", "x", "b"]);
		expect(nudgeStep(steps, "b", 1)).toEqual(["a", "x", "b"]);
		expect(nudgeStep(steps, "nope", 1)).toEqual(["a", "x", "b"]);
	});
});

describe("formatRange", () => {
	it("draws a day, a same-month range and a cross-month range", () => {
		expect(formatRange("2026-10-24", null)).toBe("Sat 24 Oct");
		expect(formatRange("2026-10-24", "2026-10-24")).toBe("Sat 24 Oct");
		expect(formatRange("2026-10-24", "2026-10-25")).toBe("Sat 24 to Sun 25 Oct");
		expect(formatRange("2026-10-31", "2026-11-01")).toBe("Sat 31 Oct to Sun 1 Nov");
	});
});

describe("fields", () => {
	const reason: FieldDef = {
		key: "reason",
		label: "Reason",
		type: "choice",
		section: "loss",
		options: [
			{ key: "price", label: "Price" },
			{ key: "old", label: "Old reason", archived: true },
			{ key: "ghost", label: "Unresponsive" },
		],
	};
	const words: FieldDef = { key: "words", label: "In their words", type: "text", section: "loss", showWhen: { key: "reason", equals: ["price", "ghost"] } };
	const size: FieldDef = { key: "size", label: "Size", type: "choice", options: [{ key: "s", label: "Small" }] };
	const sections = [{ key: "loss", label: "Loss" }, { key: "empty", label: "Empty" }];

	it("hides a field whose showWhen isn't met and shows it once it is", () => {
		expect(isFieldVisible(words, {})).toBe(false);
		expect(isFieldVisible(words, { reason: "old" })).toBe(false);
		expect(isFieldVisible(words, { reason: "price" })).toBe(true);
		expect(isFieldVisible({ ...words, showWhen: { key: "reason" } }, { reason: "old" })).toBe(true);
		expect(isFieldVisible({ ...words, showWhen: { key: "reason" } }, { reason: "" })).toBe(false);
	});

	it("drops a section with no visible field and puts unsectioned fields last", () => {
		const groups = groupFields([reason, words, size], sections, { reason: "price" });
		expect(groups.map((g) => [g.key, g.fields.map((f) => f.key)])).toEqual([
			["loss", ["reason", "words"]],
			["", ["size"]],
		]);
		expect(groupFields([words], sections, {})).toEqual([]);
	});

	it("keeps an archived option readable on a record that holds it, but never offers it", () => {
		expect(pickableOptions(reason, "price").map((o) => o.key)).toEqual(["price", "ghost"]);
		expect(pickableOptions(reason, "old").map((o) => o.key)).toEqual(["price", "old", "ghost"]);
		expect(fieldRow(reason, "old").value).toBe("Old reason");
	});

	it("reads each type back as the type it declares", () => {
		expect(parseSaved({ key: "v", label: "V", type: "money" }, "12,5")).toBe(12.5);
		expect(parseSaved({ key: "v", label: "V", type: "money" }, "abc")).toBeNull();
		expect(parseSaved(words, "  hi ")).toBe("hi");
		expect(parseSaved(words, "   ")).toBeNull();
		expect(parseSaved({ key: "m", label: "M", type: "multi" }, ["a", "b"])).toEqual(["a", "b"]);
	});

	it("builds a row that saves under its key with the parsed value", async () => {
		const saved: [string, unknown][] = [];
		const row = fieldRow({ key: "budget", label: "Budget", type: "money" }, 12000, {
			currency: "EUR",
			onSave: (k, v) => void saved.push([k, v]),
		});
		expect(row.value).toBe("€12,000");
		expect(row.editValue).toBe("12000");
		await row.onSave?.("9000");
		expect(saved).toEqual([["budget", 9000]]);
	});

	it("leaves a row read-only when no onSave is given, and empty values undrawn", () => {
		const row = fieldRow(size, null);
		expect(row.onSave).toBeUndefined();
		expect(row.value).toBeUndefined();
		expect(row.editValue).toBe("");
	});
});
