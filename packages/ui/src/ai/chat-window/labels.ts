// The strings each window prints itself, in a .ts module: a tsc consumer reads .svelte as default-only.

/** Every string the ChatGPT window prints itself. `{name}` is the connector's name. */
export interface ChatGptLabels {
  running: string;
  done: string;
  share: string;
  disclaimer: string;
  userSaid: string;
  assistantSaid: string;
}

export const CHATGPT_LABELS: ChatGptLabels = {
  running: "Calling {name}",
  done: "Used {name}",
  share: "Share",
  disclaimer: "ChatGPT can make mistakes. Check important info.",
  userSaid: "You said:",
  assistantSaid: "ChatGPT said:",
};

/** Every string the Claude window prints itself. `{name}` is the connector's name. */
export interface ClaudeLabels {
  running: string;
  done: string;
  share: string;
  disclaimer: string;
  userSaid: string;
  assistantSaid: string;
}

export const CLAUDE_LABELS: ClaudeLabels = {
  running: "Using {name}",
  done: "Used {name}",
  share: "Share",
  disclaimer: "Claude can make mistakes. Please double-check responses.",
  userSaid: "You said:",
  assistantSaid: "Claude said:",
};
