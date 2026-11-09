import Confirmation from "#src/ai/confirmation/Confirmation.svelte";
import ConfirmationTitle from "#src/ai/confirmation/ConfirmationTitle.svelte";
import ConfirmationRequest from "#src/ai/confirmation/ConfirmationRequest.svelte";
import ConfirmationAccepted from "#src/ai/confirmation/ConfirmationAccepted.svelte";
import ConfirmationRejected from "#src/ai/confirmation/ConfirmationRejected.svelte";
import ConfirmationFailed from "#src/ai/confirmation/ConfirmationFailed.svelte";
import ConfirmationActions from "#src/ai/confirmation/ConfirmationActions.svelte";
import ConfirmationAction from "#src/ai/confirmation/ConfirmationAction.svelte";

import type { ConfirmationProps } from "#src/ai/confirmation/Confirmation.svelte";
import type { ConfirmationTitleProps } from "#src/ai/confirmation/ConfirmationTitle.svelte";
import type { ConfirmationRequestProps } from "#src/ai/confirmation/ConfirmationRequest.svelte";
import type { ConfirmationAcceptedProps } from "#src/ai/confirmation/ConfirmationAccepted.svelte";
import type { ConfirmationRejectedProps } from "#src/ai/confirmation/ConfirmationRejected.svelte";
import type { ConfirmationFailedProps } from "#src/ai/confirmation/ConfirmationFailed.svelte";
import type { ConfirmationActionsProps } from "#src/ai/confirmation/ConfirmationActions.svelte";
import type { ConfirmationActionProps } from "#src/ai/confirmation/ConfirmationAction.svelte";

export type {
  ConfirmationContextValue,
  ConfirmationState,
} from "#src/ai/confirmation/confirmation-context.svelte.js";

export {
  Confirmation,
  ConfirmationTitle,
  ConfirmationRequest,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationFailed,
  ConfirmationActions,
  ConfirmationAction,
  type ConfirmationProps,
  type ConfirmationTitleProps,
  type ConfirmationRequestProps,
  type ConfirmationAcceptedProps,
  type ConfirmationRejectedProps,
  type ConfirmationFailedProps,
  type ConfirmationActionsProps,
  type ConfirmationActionProps,
  //
  Confirmation as Root,
  ConfirmationTitle as Title,
  ConfirmationRequest as Request,
  ConfirmationAccepted as Accepted,
  ConfirmationRejected as Rejected,
  ConfirmationFailed as Failed,
  ConfirmationActions as Actions,
  ConfirmationAction as Action,
};
