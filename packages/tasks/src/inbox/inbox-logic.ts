import type {
	InboxDraft,
	InboxItem,
	InboxKindFilter,
	InboxLane,
	InboxProject,
	InboxVerdict,
} from "./inbox-types.js";

/** Which lane an item sits in. The agent's own work and the person's decisions never share one. */
export function laneOf(item: InboxItem): InboxLane {
	if (item.tier === "auto") return "auto";
	return item.state === "proposed" || item.state === "working" ? "needs" : "decided";
}

export function inLane(items: InboxItem[], lane: InboxLane, kind: InboxKindFilter): InboxItem[] {
	return items.filter((item) => laneOf(item) === lane && (kind === "all" || item.kind === kind));
}

export type InboxGroup = { project: InboxProject; items: InboxItem[] };

/** Group by project in order of first appearance, so the oldest waiting item keeps its place. */
export function groupByProject(items: InboxItem[]): InboxGroup[] {
	const groups = new Map<string, InboxGroup>();
	for (const item of items) {
		const group = groups.get(item.project.id);
		if (group) group.items.push(item);
		else groups.set(item.project.id, { project: item.project, items: [item] });
	}
	return [...groups.values()];
}

/** Items in the order the screen shows them, so j and k walk what the eye sees. */
export function flatten(groups: InboxGroup[]): InboxItem[] {
	return groups.flatMap((group) => group.items);
}

/** The draft to open on: the agent's pick, else the first. */
export function startDraft(drafts: InboxDraft[], recommended?: string): InboxDraft | undefined {
	return drafts.find((draft) => draft.templateId === recommended) ?? drafts[0];
}

/** A person can act on an item only while it waits for them. */
export function isOpen(item: InboxItem): boolean {
	return item.tier === "ask" && item.state === "proposed";
}

export function canUndo(item: InboxItem): boolean {
	return item.tier === "auto" && item.state === "done";
}

/** True when a key press belongs to a text field and so isn't a shortcut. */
export function isTyping(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}
