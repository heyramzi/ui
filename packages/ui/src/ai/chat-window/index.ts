import ChatGptWindow from "#src/ai/chat-window/ChatGptWindow.svelte";
import ClaudeWindow from "#src/ai/chat-window/ClaudeWindow.svelte";

export {
  CHATGPT_LABELS,
  type ChatGptLabels,
  type ChatGptWindowProps,
} from "#src/ai/chat-window/ChatGptWindow.svelte";
export {
  CLAUDE_LABELS,
  type ClaudeLabels,
  type ClaudeWindowProps,
} from "#src/ai/chat-window/ClaudeWindow.svelte";
export {
  REVEAL_BEATS,
  revealSchedule,
  type RevealBeat,
} from "#src/ai/chat-window/reveal.svelte.js";
export type {
  ChatAssistantMessage,
  ChatMessage,
  ChatPhase,
  ChatRole,
  ChatTheme,
  ChatToolMessage,
  ChatUserMessage,
} from "#src/ai/chat-window/types.js";
export { ChatGptWindow, ClaudeWindow };
