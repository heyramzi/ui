import Confirmation from "#src/ai/confirmation/Confirmation.svelte";
import ConfirmationTitle from "#src/ai/confirmation/ConfirmationTitle.svelte";
import ConfirmationState from "#src/ai/confirmation/ConfirmationState.svelte";
import ConfirmationActions from "#src/ai/confirmation/ConfirmationActions.svelte";
import ConfirmationAction from "#src/ai/confirmation/ConfirmationAction.svelte";

import type { ConfirmationProps } from "#src/ai/confirmation/Confirmation.svelte";
import type { ConfirmationTitleProps } from "#src/ai/confirmation/ConfirmationTitle.svelte";
import type { ConfirmationStateProps } from "#src/ai/confirmation/ConfirmationState.svelte";
import type { ConfirmationActionsProps } from "#src/ai/confirmation/ConfirmationActions.svelte";
import type { ConfirmationActionProps } from "#src/ai/confirmation/ConfirmationAction.svelte";

export type {
  ConfirmationContextValue,
  ConfirmationKind,
} from "#src/ai/confirmation/confirmation-context.svelte.js";

export {
  Confirmation,
  ConfirmationTitle,
  ConfirmationState,
  ConfirmationActions,
  ConfirmationAction,
  type ConfirmationProps,
  type ConfirmationTitleProps,
  type ConfirmationStateProps,
  type ConfirmationActionsProps,
  type ConfirmationActionProps,
  //
  Confirmation as Root,
  ConfirmationTitle as Title,
  ConfirmationState as State,
  ConfirmationActions as Actions,
  ConfirmationAction as Action,
};
