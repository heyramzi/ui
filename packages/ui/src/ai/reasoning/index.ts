import Reasoning from "#src/ai/reasoning/Reasoning.svelte";
import ReasoningTrigger from "#src/ai/reasoning/ReasoningTrigger.svelte";
import ReasoningContent from "#src/ai/reasoning/ReasoningContent.svelte";

import type { ReasoningProps } from "#src/ai/reasoning/Reasoning.svelte";
import type { ReasoningTriggerProps } from "#src/ai/reasoning/ReasoningTrigger.svelte";
import type { ReasoningContentProps } from "#src/ai/reasoning/ReasoningContent.svelte";
import type { ReasoningContextValue } from "#src/ai/reasoning/reasoning-context.svelte.js";

export {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
  type ReasoningProps,
  type ReasoningTriggerProps,
  type ReasoningContentProps,
  type ReasoningContextValue,
  //
  Reasoning as Root,
  ReasoningTrigger as Trigger,
  ReasoningContent as Content,
};
