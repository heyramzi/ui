import { getContext, setContext } from "svelte";

const CONFIRMATION_CONTEXT_KEY = Symbol("confirmation-context");

export type ConfirmationState = "idle" | "requested" | "accepted" | "rejected" | "failed";

export interface ConfirmationContextValue {
  kind: ConfirmationState;
  executing: boolean;
}

export function setConfirmationContext(value: ConfirmationContextValue) {
  setContext(CONFIRMATION_CONTEXT_KEY, value);
}

export function getConfirmationContext(): ConfirmationContextValue {
  const context = getContext<ConfirmationContextValue>(CONFIRMATION_CONTEXT_KEY);
  if (!context) {
    throw new Error("Confirmation parts must be used inside a <Confirmation>.");
  }
  return context;
}
