/** Every word the docs surface prints. The app passes a partial to localise it. */
export type DocLabels = {
  titlePlaceholder: string;
  untitled: string;
  edited: string;
  showAuthorNames: string;
  ownedBy: string;
  lastEditBy: string;
  showHistory: string;
  menu: string;
  filter: string;
  noResults: string;
  moveTo: string;
  duplicate: string;
  rename: string;
  template: string;
  favorite: string;
  unfavorite: string;
  copy: string;
  copyUrl: string;
  copyTitle: string;
  copyTitleAsLink: string;
  copyMarkdown: string;
  remind: string;
  history: string;
  delete: string;
  deleteTitle: (title: string) => string;
  deleteDetail: string;
  cancel: string;
  back: string;
  outline: string;
  copyLink: string;
};

export const DEFAULT_DOC_LABELS: DocLabels = {
  titlePlaceholder: "New document",
  untitled: "Untitled",
  edited: "Edited",
  showAuthorNames: "Show author names",
  ownedBy: "Owned by",
  lastEditBy: "Last edit by",
  showHistory: "Show document history",
  menu: "Document actions",
  filter: "Filter…",
  noResults: "Nothing matches",
  moveTo: "Move to",
  duplicate: "Duplicate",
  rename: "Rename",
  template: "New template from document",
  favorite: "Favorite",
  unfavorite: "Remove from favorites",
  copy: "Copy",
  copyUrl: "Copy URL",
  copyTitle: "Copy title",
  copyTitleAsLink: "Copy title as link",
  copyMarkdown: "Copy content as Markdown",
  remind: "Remind me",
  history: "Show document history",
  delete: "Delete",
  deleteTitle: (title) => `Delete "${title}"`,
  deleteDetail: "This can't be undone.",
  cancel: "Cancel",
  back: "Back",
  outline: "Outline",
  copyLink: "Copy link",
};

export function docLabels(partial?: Partial<DocLabels>): DocLabels {
  return { ...DEFAULT_DOC_LABELS, ...partial };
}
