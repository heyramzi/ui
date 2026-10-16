import PromptInput from "#src/ai/prompt-input/PromptInput.svelte";
import PromptInputBody from "#src/ai/prompt-input/PromptInputBody.svelte";
import PromptInputToolbar from "#src/ai/prompt-input/PromptInputToolbar.svelte";
import PromptInputTextarea from "#src/ai/prompt-input/PromptInputTextarea.svelte";
import PromptInputSubmit from "#src/ai/prompt-input/PromptInputSubmit.svelte";

import type { PromptInputProps } from "#src/ai/prompt-input/PromptInput.svelte";
import type { PromptInputBodyProps } from "#src/ai/prompt-input/PromptInputBody.svelte";
import type { PromptInputToolbarProps } from "#src/ai/prompt-input/PromptInputToolbar.svelte";
import type { PromptInputTextareaProps } from "#src/ai/prompt-input/PromptInputTextarea.svelte";
import type {
  PromptInputSubmitProps,
  PromptInputStatus,
} from "#src/ai/prompt-input/PromptInputSubmit.svelte";

export {
  PromptInput,
  PromptInputBody,
  PromptInputToolbar,
  PromptInputTextarea,
  PromptInputSubmit,
  type PromptInputProps,
  type PromptInputBodyProps,
  type PromptInputToolbarProps,
  type PromptInputTextareaProps,
  type PromptInputSubmitProps,
  type PromptInputStatus,
  //
  PromptInput as Root,
  PromptInputBody as Body,
  PromptInputToolbar as Toolbar,
  PromptInputTextarea as Textarea,
  PromptInputSubmit as Submit,
};
