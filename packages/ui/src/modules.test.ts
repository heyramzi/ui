import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vite-plus/test";
import * as status from "#src/status/index.js";
import * as panel from "#src/panel/index.js";
import * as record from "#src/record/index.js";
import * as taskInbox from "#src/tasks/inbox/index.js";
import * as inbox from "#src/inbox/index.js";
import * as thread from "#src/thread/index.js";
import type {
	PanelStat as FromTasksPanelStat,
	SidePanelWidth as FromTasksWidth,
	StatusDef as FromTasksStatusDef,
	StatusDotVariant as FromTasksVariant,
	StatusId as FromTasksId,
	StatusMap as FromTasksMap,
	Statuses as FromTasksStatuses,
} from "#src/tasks/index.js";
import type { PanelStat, SidePanelWidth } from "#src/panel/index.js";
import type { StatusDef, StatusDotVariant, StatusId, StatusMap, Statuses } from "#src/status/index.js";

// Both spellings of every moved type have to be the same type.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const sameTypes: [
	Same<PanelStat, FromTasksPanelStat>,
	Same<SidePanelWidth, FromTasksWidth>,
	Same<StatusDef, FromTasksStatusDef>,
	Same<StatusDotVariant, FromTasksVariant>,
	Same<StatusId<{ a: StatusDef }>, FromTasksId<{ a: StatusDef }>>,
	Same<StatusMap, FromTasksMap>,
	Same<Statuses, FromTasksStatuses>,
] = [true, true, true, true, true, true, true];

const pkg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8")) as {
	exports: Record<string, string | Record<string, string>>;
};

describe("module split", () => {
	it("keeps every moved name on tasks, the same object as on its new module", async () => {
		// The kanban board reads matchMedia on import, and jsdom has none.
		vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
		const tasks = await import("#src/tasks/index.js");
		expect(sameTypes).toHaveLength(7);
		expect(tasks.StatusBadge).toBe(status.StatusBadge);
		expect(tasks.StatusDot).toBe(status.StatusDot);
		expect(tasks.StatusIcon).toBe(status.StatusIcon);
		expect(tasks.defineStatuses).toBe(status.defineStatuses);
		expect(tasks.StatusBadge).toBeDefined();
		expect(tasks.SidePanel).toBe(panel.SidePanel);
		expect(Object.keys(taskInbox)).toContain("Inbox");
	});

	it("holds the record page's names", () => {
		expect(record.RecordShell).toBeDefined();
		expect(record.DEFAULT_RECORD_LABELS).toBeDefined();
	});

	it("names what the new modules export", () => {
		expect(thread.Thread).toBeDefined();
		expect(inbox.ThreadInbox).toBeDefined();
		expect(inbox.InboxCard).toBeDefined();
		expect(inbox.threadsOf).toBeTypeOf("function");
	});

	it("resolves every export path to a file", () => {
		const root = join(dirname(fileURLToPath(import.meta.url)), "..");
		const missing: string[] = [];
		for (const [name, target] of Object.entries(pkg.exports)) {
			const path = typeof target === "string" ? target : (target.default ?? target.svelte);
			if (path.includes("*") || path.endsWith(".css")) continue;
			if (!existsSync(join(root, path))) missing.push(`${name} -> ${path}`);
		}
		expect(missing).toEqual([]);
	});

	it("keeps the old subpaths and adds the new ones", () => {
		for (const name of [
			"./tasks",
			"./tasks/status",
			"./tasks/status-dot",
			"./tasks/statuses",
			"./tasks/side-panel",
			"./tasks/record",
			"./tasks/inbox",
			"./status",
			"./panel",
			"./record",
			"./thread",
			"./inbox",
		]) {
			expect(pkg.exports[name], name).toBeDefined();
		}
	});
});
