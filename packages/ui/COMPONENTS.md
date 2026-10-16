# Components

Every component in `@heyramzi/ui`, one line each. Import a component from its subpath, e.g.
`import { Button } from "@heyramzi/ui/shadcn/button"`.

The style layer lives in [`src/tokens.css`](./src/tokens.css) and the motion CSS in
[`src/animations`](./src/animations). Components that already exist in
[shadcn-svelte](https://shadcn-svelte.com) are linked there from the root README.

## shadcn primitives (`src/shadcn`)

- `accordion` — Accordion
- `alert` — alertVariants, AlertVariant
- `alert-dialog` — AlertDialog
- `attachment` — Attachment
- `avatar` — Avatar
- `badge` — Badge, badgeVariants, BadgeVariant
- `breadcrumb` — Breadcrumb
- `bubble` — Bubble
- `button` — Button
- `calendar` — Calendar
- `card` — Card
- `checkbox` — Checkbox
- `code-block` — CodeBlock. Highlight with `useHighlightedCode` from `@heyramzi/ui/shadcn/hooks/use-highlighted-code.svelte` (Shiki, ANSI too)
- `collapsible` — Collapsible
- `command` — Command
- `context-menu` — ContextMenu
- `dialog` — Dialog
- `dropdown-menu` — CheckboxGroup, CheckboxItem, Content, Portal, DropdownMenu, DropdownMenuCheckboxGroup
- `empty` — Empty
- `field` — Field
- `hover-card` — HoverCard
- `input` — Input
- `input-otp` — InputOtp
- `label` — Label
- `marker` — Marker
- `message` — Message
- `message-scroller` — MessageScroller, the chat transcript scroller: follows a streamed reply, anchors each turn, keeps place on prepend
- `popover` — Popover
- `progress` — Progress
- `radio-group` — RadioGroup
- `scroll-area` — ScrollArea
- `select` — Select
- `separator` — Separator
- `sheet` — Sheet (`side`: `left`, `right` or `bottom`)
- `sidebar` — Sidebar
- `skeleton` — Skeleton
- `slider` — Slider
- `sonner` — Toaster
- `spinner` — Spinner
- `switch` — Switch
- `table` — Table
- `tabs` — Tabs
- `textarea` — Textarea
- `toggle` — toggleVariants, ToggleSize, ToggleVariant, ToggleVariants
- `toggle-group` — ToggleGroup
- `tooltip` — Tooltip
- `trace` — Trace, an agent's steps: reasoning, tool calls and sources as status rows that can expand

## Effects (`src/effects`)

- `animated-beam` — AnimatedBeam, AnimatedBeamProps, AnchorPosition
- `border-beam` — BorderBeam
- `image-comparison` — ImageComparison
- `image-reveal` — ImageReveal, ImageRevealProps, ImageRevealHandle
- `magnetic` — magnetic
- `marquee` — Marquee
- `progressive-blur` — ProgressiveBlur
- `reveal` — InView, AnimatedGroup, TextEffect, observeInView, RevealPreset, RevealPer
- `shader-gradient` — ShaderGradient, ShaderGradientProps, ShaderGradientUniforms
- `spotlight` — Spotlight
- `theme-toggle` — ThemeToggle, revealTheme. Props: `isDark`, `mode` (`light`, `dark`, `system`; swaps in the Monitor icon), `onToggle`, `variant` (`outline`, `ghost`, `inverted`; `inverted` boolean is an alias), `size`, `label`, `title`, `skipTransition`, `class`. `revealTheme(event, apply, { skip, duration, easing })` is the circular wipe on its own: `import { revealTheme } from "@heyramzi/ui"` (the `./lib/*` subpath points at `.js` and the source is `.ts`).

## Animations (`src/animations`)

- `accordion` — keyframe utilities
- `avatar-group-hover` — keyframe utilities
- `card-tilt` — keyframe utilities
- `digit-pop-in` — keyframe utilities
- `dropdown` — keyframe utilities
- `icon-swap` — keyframe utilities
- `input-clear-dissolve` — keyframe utilities
- `input-shake` — keyframe utilities
- `learn-more-hover` — keyframe utilities
- `like-button` — keyframe utilities
- `modal` — keyframe utilities
- `notification-badge` — keyframe utilities
- `page-side-by-side` — keyframe utilities
- `panel` — keyframe utilities
- `plus-menu-morph` — keyframe utilities
- `reasoning-stream` — keyframe utilities
- `resize` — keyframe utilities
- `shimmer-text` — keyframe utilities
- `skeleton-reveal` — keyframe utilities
- `spinning-counter` — keyframe utilities
- `streaming-text` — keyframe utilities
- `success-check` — keyframe utilities
- `tabs-sliding` — keyframe utilities
- `text-swap` — keyframe utilities
- `texts-reveal` — keyframe utilities
- `thinking-states` — keyframe utilities
- `tooltip` — keyframe utilities

## AI and chat (`src/ai`)

- `composer` — Composer, ComposerProps
- `confirmation` — Confirmation, ConfirmationTitle, ConfirmationRequest, ConfirmationAccepted, ConfirmationRejected, ConfirmationActions, ConfirmationAction
- `loading-state` — PixelLoader
- `prompt-input` — PromptInput, PromptInputBody, PromptInputToolbar, PromptInputTextarea, PromptInputSubmit
- `reasoning` — Reasoning, ReasoningTrigger, ReasoningContent
- `response` — Response
- `suggestion` — Suggestion, Suggestions
- `thinking-dots` — ThinkingDots
- `typing-dots` — TypingDots
- `voice-waveform` — VoiceWaveform

---

Skipped on purpose: brand assets (logos, marks, brand renderer, language flags,
locale switch), kanban, list, gantt and status (they live in `@heyramzi/tasks`), and charts
(they live in `@heyramzi/charts`). The bot avatars
are in `src/agents`, imported from `@heyramzi/ui/agents`.
