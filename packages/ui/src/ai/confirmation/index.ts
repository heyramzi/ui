import type { Component } from "svelte";
import Confirmation from "#src/ai/confirmation/Confirmation.svelte";
import ConfirmationTitle from "#src/ai/confirmation/ConfirmationTitle.svelte";
import ConfirmationStateView from "#src/ai/confirmation/ConfirmationState.svelte";
import ConfirmationActions from "#src/ai/confirmation/ConfirmationActions.svelte";
import ConfirmationAction from "#src/ai/confirmation/ConfirmationAction.svelte";

import type { ConfirmationProps } from "#src/ai/confirmation/Confirmation.svelte";
import type { ConfirmationTitleProps } from "#src/ai/confirmation/ConfirmationTitle.svelte";
import type { ConfirmationStateProps } from "#src/ai/confirmation/ConfirmationState.svelte";
import type { ConfirmationActionsProps } from "#src/ai/confirmation/ConfirmationActions.svelte";
import type { ConfirmationActionProps } from "#src/ai/confirmation/ConfirmationAction.svelte";

export type {
  ConfirmationContextValue,
  ConfirmationState,
} from "#src/ai/confirmation/confirmation-context.svelte.js";

type ConfirmationStatePartProps = Omit<ConfirmationStateProps, "when">;
type ConfirmationRequestProps = ConfirmationStatePartProps;
type ConfirmationAcceptedProps = ConfirmationStatePartProps;
type ConfirmationRejectedProps = ConfirmationStatePartProps;
type ConfirmationFailedProps = ConfirmationStatePartProps;

/** ConfirmationState with `when` fixed, so each state keeps its own tag. */
function statePart(when: ConfirmationStateProps["when"]): Component<ConfirmationStatePartProps> {
  return (internals, props) =>
    ConfirmationStateView(internals, {
      when,
      get children() {
        return props.children;
      },
    });
}

const ConfirmationRequest = statePart("requested");
const ConfirmationAccepted = statePart("accepted");
const ConfirmationRejected = statePart("rejected");
const ConfirmationFailed = statePart("failed");

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
