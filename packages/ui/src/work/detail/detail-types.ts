/** The task page's own words. The comment thread's come through `threadLabels`. */
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
  properties: "Properties",
};
