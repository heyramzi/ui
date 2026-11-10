import { getContext, setContext } from "svelte";

const KEY = Symbol("attachment");

/** Called by Attachment.Root: the id its Title takes, so the Trigger and Actions can point at it. */
export function setAttachmentTitleId(id: string): void {
  setContext(KEY, id);
}

/** The enclosing card's title id, or undefined outside an Attachment.Root. */
export function getAttachmentTitleId(): string | undefined {
  return getContext<string | undefined>(KEY);
}
