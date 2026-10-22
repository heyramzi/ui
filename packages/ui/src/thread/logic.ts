import type { ThreadComment, ThreadLabels, ThreadNode } from "#src/thread/types.js";
import { DEFAULT_THREAD_LABELS } from "#src/thread/types.js";

function time(comment: ThreadComment): number {
	const ms = Date.parse(comment.createdAt);
	return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
}

/** Oldest first, a malformed timestamp last, ties in the order they came. */
function byTime(comments: ThreadComment[]): ThreadComment[] {
	return comments
		.map((comment, index) => ({ comment, index }))
		.toSorted((a, b) => time(a.comment) - time(b.comment) || a.index - b.index)
		.map((row) => row.comment);
}

/**
 * Roots in time order, each with its replies. A reply to a reply joins the root's list, a reply whose
 * parent is gone becomes a root, and a loop of parents can't hang the walk.
 */
export function buildThread(comments: ThreadComment[]): ThreadNode[] {
	const byId = new Map(comments.map((comment) => [comment.id, comment]));

	function rootOf(comment: ThreadComment): ThreadComment {
		const seen = new Set<string>([comment.id]);
		let current = comment;
		for (;;) {
			const parent = current.parentId ? byId.get(current.parentId) : undefined;
			if (!parent) return current;
			if (seen.has(parent.id)) return comment;
			seen.add(parent.id);
			current = parent;
		}
	}

	const replies = new Map<string, ThreadComment[]>();
	const roots: ThreadComment[] = [];
	for (const comment of comments) {
		const root = rootOf(comment);
		if (root.id === comment.id) roots.push(comment);
		else replies.set(root.id, [...(replies.get(root.id) ?? []), comment]);
	}
	return byTime(roots).map((comment) => ({ comment, replies: byTime(replies.get(comment.id) ?? []) }));
}

/** How many conversations are resolved. */
export function resolvedCount(nodes: ThreadNode[]): number {
	return nodes.filter((node) => node.comment.resolved).length;
}

export function resolveThreadLabels(overrides?: Partial<ThreadLabels>): ThreadLabels {
	return { ...DEFAULT_THREAD_LABELS, ...overrides };
}

/** Fills `{count}` in a label, so a French host writes its own sentence. */
export function fillCount(label: string, count: number): string {
	return label.replaceAll("{count}", String(count));
}
