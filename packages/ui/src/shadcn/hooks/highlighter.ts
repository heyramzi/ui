import {
  createHighlighterCore,
  type GrammarState,
  type HighlighterCore,
  type ThemedToken,
  type ThemeRegistrationRaw,
} from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

// Add the languages you need. Each one loads the first time it is used.
const languages = {
  bash: () => import("shiki/langs/shellscript.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  svelte: () => import("shiki/langs/svelte.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
};

const aliases: Record<string, keyof typeof languages> = {
  js: "javascript",
  md: "markdown",
  py: "python",
  sh: "bash",
  shell: "bash",
  shellscript: "bash",
  ts: "typescript",
  yml: "yaml",
  zsh: "bash",
};

// VS Code's pair colours an imported name too. No bundled light theme clears 4.5:1 on bg-muted.
const THEMES = { light: "light-plus", dark: "dark-plus" } as const;

type Mode = keyof typeof THEMES;
type Rgb = [number, number, number];

// The faintest code surface in each mode: a highlighted line (bg-muted), the input tint in dark.
const SURFACES: Record<Mode, Rgb> = { light: [232, 232, 232], dark: [52, 52, 52] };

function luminance(rgb: Rgb) {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Rgb, b: Rgb) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Steps an opaque hex colour toward black (light) or white (dark), keeping its hue, until it reads 4.5:1.
function readable(hex: string, mode: Mode) {
  if (!/^#[\da-f]{6}(ff)?$/i.test(hex)) return hex;
  const base = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as Rgb;
  let rgb = base;
  for (let step = 0.01; contrast(rgb, SURFACES[mode]) < 4.5 && step <= 1; step += 0.01) {
    rgb = base.map((v) => Math.round(mode === "light" ? v * (1 - step) : v + (255 - v) * step)) as Rgb;
  }
  return `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

async function readableTheme(theme: Promise<{ default: ThemeRegistrationRaw }>, mode: Mode) {
  const { default: raw } = await theme;
  return {
    ...raw,
    tokenColors: raw.tokenColors?.map((rule) =>
      rule.settings.foreground
        ? { ...rule, settings: { ...rule.settings, foreground: readable(rule.settings.foreground, mode) } }
        : rule,
    ),
  };
}

let highlighter: Promise<HighlighterCore> | undefined;

function getHighlighter() {
  highlighter ??= createHighlighterCore({
    themes: [
      readableTheme(import("shiki/themes/light-plus.mjs"), "light"),
      readableTheme(import("shiki/themes/dark-plus.mjs"), "dark"),
    ],
    langs: [],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });

  return highlighter;
}

function getLanguage(language: string) {
  const name = language.toLowerCase();

  if (name === "ansi") {
    return name;
  }

  if (name in languages) {
    return name as keyof typeof languages;
  }

  return aliases[name] ?? null;
}

// One highlighted token. Render it as a `<span>` with this style and class.
export type HighlightedToken = {
  content: string;
  style?: string;
  class?: string;
};

// A line of plain text, or the highlighted tokens of a line.
export type HighlightedLine = string | HighlightedToken[];

function toHighlightedLine(tokens: ThemedToken[]): HighlightedToken[] {
  return tokens.map((token) => ({
    content: token.content,
    style: Object.entries(token.htmlStyle ?? {})
      .map(([property, value]) => `${property}:${value}`)
      .join(";"),
    class: "text-(--shiki-light) dark:text-(--shiki-dark)",
  }));
}

export type Highlighter = NonNullable<Awaited<ReturnType<typeof loadHighlighter>>>;

// Loads a language and returns a highlighter for it, or null for a language
// that is not listed.
export async function loadHighlighter(language: string) {
  const lang = getLanguage(language);

  if (!lang) {
    return null;
  }

  const shiki = await getHighlighter();

  if (lang !== "ansi" && !shiki.getLoadedLanguages().includes(lang)) {
    await shiki.loadLanguage(languages[lang]);
  }

  return {
    // Returns the tokens of each line, and the grammar state after the last
    // line. Pass that state back to continue where the code left off.
    highlight(code: string, state?: GrammarState) {
      const tokenize = (text: string) =>
        shiki.codeToTokens(text, {
          lang,
          themes: THEMES,
          defaultColor: false,
          grammarState: state,
        }).tokens;

      // ANSI has no grammar state, so each line is tokenized on its own and
      // gets the same colors whether it arrives in one piece or streams.
      const tokens =
        lang === "ansi" ? code.split("\n").flatMap((line) => tokenize(line)) : tokenize(code);

      return {
        lines: tokens.map((line) => toHighlightedLine(line)),
        state: shiki.getLastGrammarState(tokens),
      };
    },
  };
}

// Returns the tokens of each line, or null for a language that is not listed.
export async function highlightCode(code: string, language: string) {
  const highlighter = await loadHighlighter(language);

  return highlighter ? highlighter.highlight(code).lines : null;
}
