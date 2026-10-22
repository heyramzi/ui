/** One entry in a task's thread. The host resolves the author's name. */
export type TaskComment = {
  id: string;
  author: string;
  body: string;
  /** ISO timestamp. */
  createdAt: string;
  /** An agent wrote it: the thread draws the agent avatar and an "AI" label. */
  agent?: boolean;
  /** Set when the body changed after posting. */
  edited?: boolean;
};

export type TaskDetailLabels = {
  markComplete: string;
  markIncomplete: string;
  editTitle: string;
  description: string;
  addDescription: string;
  editDescription: string;
  save: string;
  saving: string;
  cancel: string;
  comments: string;
  commentPlaceholder: string;
  commentSend: string;
  commentEdit: string;
  commentDelete: string;
  commentEdited: string;
  commentsEmpty: string;
  ai: string;
  properties: string;
};

export const DEFAULT_TASK_DETAIL_LABELS: TaskDetailLabels = {
  markComplete: "Mark complete",
  markIncomplete: "Mark incomplete",
  editTitle: "Edit title",
  description: "Description",
  addDescription: "Add a description",
  editDescription: "Edit description",
  save: "Save",
  saving: "Saving",
  cancel: "Cancel",
  comments: "Activity",
  commentPlaceholder: "Leave a comment",
  commentSend: "Comment",
  commentEdit: "Edit comment",
  commentDelete: "Delete comment",
  commentEdited: "edited",
  commentsEmpty: "No comments yet",
  ai: "AI",
  properties: "Properties",
};
