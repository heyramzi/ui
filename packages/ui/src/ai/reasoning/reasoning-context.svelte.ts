import { getContext, setContext } from "svelte";

const REASONING_CONTEXT_KEY = Symbol("reasoning-context");

export interface ReasoningContextValue {
  isStreaming: boolean;
  duration: number;
}

export function setReasoningContext(value: ReasoningContextValue) {
  setContext(REASONING_CONTEXT_KEY, value);
}

export function getReasoningContext(): ReasoningContextValue {
  const context = getContext<ReasoningContextValue>(REASONING_CONTEXT_KEY);
  if (!context) {
    throw new Error("Reasoning parts must be used inside a <Reasoning>.");
  }
  return context;
}
