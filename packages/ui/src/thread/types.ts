import type { PhosphorIcon } from "#src/lib/icon-types.js";

export type ThreadAuthorKind = "user" | "agent";

export type ThreadAuthor = {
  kind: ThreadAuthorKind;
  name: string;
  /** Image URL for a person. The host's own portrait goes through the `avatar` snippet. */
  avatar?: string;
};

/** Where on a canvas a comment is pinned: a node and an offset from it, or a point. */
export type ThreadAnchor = {
  nodeId?: string;
  dx?: number;
  dy?: number;
  x?: number;
  y?: number;
};

/** One comment on any subject. The host resolves the author's name. */
export type ThreadComment = {
  id: string;
  author: ThreadAuthor;
  /** Plain text, shown as written. Also the fallback when `content` is missing. */
  body: string;
  /** Tiptap JSON. When set, the thread draws it through the editor's renderer instead of `body`. */
  content?: Record<string, unknown>;
  /** ISO timestamp. */
  createdAt: string;
  /** Set when the body changed after posting. */
  edited?: boolean;
  /** The comment this one answers. A reply to a reply sits under the same root. */
  parentId?: string | null;
  /** Only a root carries it: the whole conversation is resolved. */
  resolved?: boolean;
  anchor?: ThreadAnchor | null;
};

export type ThreadPost = {
  body: string;
  parentId: string | null;
  anchor?: ThreadAnchor | null;
};

/** A root comment with its replies in time order. */
export type ThreadNode = {
  comment: ThreadComment;
  replies: ThreadComment[];
};

/** Something that happened to the subject, drawn as one quiet line between comments. */
export type ThreadEvent = {
  id: string;
  /** The whole sentence, actor first: "Project Manager moved this from Open to In progress". */
  title: string;
  /** ISO timestamp. */
  at: string;
  icon?: PhosphorIcon;
};

/** The thread in time order: a conversation, or a run of events between two of them. */
export type ThreadItem =
  | { type: "node"; key: string; node: ThreadNode }
  | { type: "events"; key: string; events: ThreadEvent[] };

export type ThreadLabels = {
  title: string;
  empty: string;
  placeholder: string;
  replyPlaceholder: string;
  send: string;
  sending: string;
  reply: string;
  edit: string;
  delete: string;
  edited: string;
  save: string;
  cancel: string;
  resolve: string;
  unresolve: string;
  resolved: string;
  /** Shows `{count}` resolved conversations. */
  showResolved: string;
  hideResolved: string;
  agent: string;
  pinned: string;
  showMore: string;
  showLess: string;
};

export const DEFAULT_THREAD_LABELS: ThreadLabels = {
  title: "Activity",
  empty: "No comments yet",
  placeholder: "Leave a comment",
  replyPlaceholder: "Reply",
  send: "Comment",
  sending: "Sending",
  reply: "Reply",
  edit: "Edit comment",
  delete: "Delete comment",
  edited: "edited",
  save: "Save",
  cancel: "Cancel",
  resolve: "Resolve",
  unresolve: "Reopen",
  resolved: "Resolved",
  showResolved: "Show {count} resolved",
  hideResolved: "Hide resolved",
  agent: "AI",
  pinned: "Pinned",
  showMore: "Show more",
  showLess: "Show less",
};
