// Each glyph is a file a CSS mask paints in the current colour. Sources and licences: icons/LICENSE.

import gptChevron from "#src/ai/chat-window/icons/chatgpt-chevron.svg";
import gptCopy from "#src/ai/chat-window/icons/chatgpt-copy.svg";
import gptMic from "#src/ai/chat-window/icons/chatgpt-mic.svg";
import gptMore from "#src/ai/chat-window/icons/chatgpt-more.svg";
import gptPlus from "#src/ai/chat-window/icons/chatgpt-plus.svg";
import gptRegenerate from "#src/ai/chat-window/icons/chatgpt-regenerate.svg";
import gptShare from "#src/ai/chat-window/icons/chatgpt-share.svg";
import gptSidebar from "#src/ai/chat-window/icons/chatgpt-sidebar.svg";
import gptThumb from "#src/ai/chat-window/icons/chatgpt-thumb.svg";
import gptVoice from "#src/ai/chat-window/icons/chatgpt-voice.svg";
import claudeChevron from "#src/ai/chat-window/icons/claude-chevron.svg";
import claudeCopy from "#src/ai/chat-window/icons/claude-copy.svg";
import claudePlus from "#src/ai/chat-window/icons/claude-plus.svg";
import claudeRetry from "#src/ai/chat-window/icons/claude-retry.svg";
import claudeSend from "#src/ai/chat-window/icons/claude-send.svg";
import claudeSidebar from "#src/ai/chat-window/icons/claude-sidebar.svg";
import claudeSliders from "#src/ai/chat-window/icons/claude-sliders.svg";
import claudeSpark from "#src/ai/chat-window/icons/claude-spark.svg";
import claudeThumb from "#src/ai/chat-window/icons/claude-thumb.svg";

export const CHATGPT_ICONS = {
  chevron: gptChevron,
  copy: gptCopy,
  mic: gptMic,
  more: gptMore,
  plus: gptPlus,
  regenerate: gptRegenerate,
  share: gptShare,
  sidebar: gptSidebar,
  thumb: gptThumb,
  voice: gptVoice,
} as const;

export const CLAUDE_ICONS = {
  chevron: claudeChevron,
  copy: claudeCopy,
  plus: claudePlus,
  retry: claudeRetry,
  send: claudeSend,
  sidebar: claudeSidebar,
  sliders: claudeSliders,
  spark: claudeSpark,
  thumb: claudeThumb,
} as const;
