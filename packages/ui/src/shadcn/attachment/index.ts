import Action from "#src/shadcn/attachment/attachment-action.svelte";
import Actions from "#src/shadcn/attachment/attachment-actions.svelte";
import Content from "#src/shadcn/attachment/attachment-content.svelte";
import Description from "#src/shadcn/attachment/attachment-description.svelte";
import Group from "#src/shadcn/attachment/attachment-group.svelte";
import Media from "#src/shadcn/attachment/attachment-media.svelte";
import Title from "#src/shadcn/attachment/attachment-title.svelte";
import Trigger from "#src/shadcn/attachment/attachment-trigger.svelte";
import Root, {
  attachmentVariants,
  type AttachmentOrientation,
  type AttachmentSize,
  type AttachmentState,
} from "#src/shadcn/attachment/attachment.svelte";

export {
  Root,
  Group,
  Media,
  Content,
  Title,
  Description,
  Actions,
  Action,
  Trigger,
  attachmentVariants,
  type AttachmentSize,
  type AttachmentOrientation,
  type AttachmentState,
  //
  Root as Attachment,
  Group as AttachmentGroup,
  Media as AttachmentMedia,
  Content as AttachmentContent,
  Title as AttachmentTitle,
  Description as AttachmentDescription,
  Actions as AttachmentActions,
  Action as AttachmentAction,
  Trigger as AttachmentTrigger,
};
