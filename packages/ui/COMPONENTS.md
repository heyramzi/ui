# Components

Every component in `@heyramzi/ui`, one line each. Import a component from its subpath, e.g.
`import { Button } from "@heyramzi/ui/shadcn/button"`.

The style layer lives in [`src/tokens`](./src/tokens) and the motion CSS in
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
- `command` — Command, computeCommandScore (the scorer, for a custom `filter`)
- `context-menu` — ContextMenu
- `dialog` — Dialog
- `dropdown-menu` — CheckboxGroup, CheckboxItem, Content, Portal, DropdownMenu, DropdownMenuCheckboxGroup
- `empty` — Empty
- `field` — Field and its parts, plus SimpleField: label, hint or error and the control, with the message linked by `aria-describedby`
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

## Components (`src/components`)

Generic pieces built on the primitives, imported from `@heyramzi/ui/components/<name>`.

- `copy` — CopyButton, copyText, copyRichText, htmlToPlainText, Copied
- `data-table` — SortableHead, Pagination, InfiniteScroll, RowContextMenu, TableSkeleton, and the sort, page and filter helpers
- `hold-to-confirm` — HoldToConfirm, press and hold to confirm
- `language-flag` — LanguageFlag, LANGUAGE_FLAGS (code to `/flags/*.svg`, also a SegmentedFilter option's `image`)
- `list-page` — ListPageShell, MasterDetail, GroupedList, RailRow and the rest of the master-detail page kit, DetailPanel, ToolbarSearch, toolbarTriggerClass, NoticeBar, EmptyState, FilterPopover, setSectionHost
- `toolbar` — Toolbar: one row at any width; search, tabs and the view switch fold into menus in a narrow pane. Its search box is `list-page`'s ToolbarSearch
- `mark` — Mark, a logo or photo glyph with an initial fallback
- `open-in` — OpenIn, a link out to a tool that takes the tool's name, label and mark as a prop
- `picker` — Picker, MarkPicker, pickerTriggerClass, a command palette at popover scale
- `docs` — DocPage, OnThisPage, ScrollSpy: one page anatomy for documentation, an icon, title and summary header, a reading column and a contents rail that becomes a bar on a narrow pane
- `section-card` — SectionCard, a card with a fixed-height header, an h3 title, optional actions and a line under it
- `section-header` — SectionHeader, a section label with a count chip, a line of description and actions; SectionLabel, the label alone
- `field-row` — FieldRow, a labelled control with its action button at the control's height
- `table-view` — TableView, a read-only table from columns and rows: numeric columns, footer row, custom cell; opt-in: `bare`, sortable heads (`column.sortable`, bind `sort`; the caller orders `rows`), `rowHref` (a real link over the row; `onRowLink` opens in place on a plain click), `onRowClick`, `selectable` + bind `selected`, `rowMenu` (context-menu items), `group` (a `null` key sits with no header) + `groupHeader` + `collapsible`, `subRow` + `expanded`, `loading` (skeleton rows in the frame), `empty`, `trailing`, `head`, and per-column `hideBelow`, `sticky`, `interactive`, `class`
- `segmented` — AnimatedTabs (pill or underline), SegmentedFilter, SegmentedNav, SectionRuns, one bordered track with a sliding pill, a badge note and an overflow menu
- `theme` — ThemeProvider, mode, userPrefersMode, setMode, toggleMode, resetMode: the one light and dark system (mode-watcher, optional peer). Mount `<ThemeProvider initial onChange themeColors modeStorageKey />` once; flip with `toggleMode()`, read `mode.current`. Pair with `revealTheme(event, toggleMode)` from `@heyramzi/ui/lib/theme-transition.js` for the wipe
- `star-rating-input` — StarRatingInput
- `svg` — Svg, an SVG file imported with `?raw`

## Effects (`src/effects`)

Named exports from `@heyramzi/ui/effects/<name>`, e.g.
`import { Marquee } from "@heyramzi/ui/effects/marquee"`.

- `interactive-hover-button` — InteractiveHoverButton, a dot that grows into the fill
- `animated-beam` — AnimatedBeam, AnimatedBeamProps, AnchorPosition
- `border-beam` — BorderBeam, sizePresets, sizeThemePresets, themeColors and their types
- `image-comparison` — ImageComparison, ComparisonImage, a before/after wipe with a bindable position, side badges and a hint sweep
- `image-reveal` — ImageReveal, ImageRevealProps, ImageRevealHandle
- `magnetic` — magnetic
- `magic-card` — MagicCard. Props: `glow`, `radius`, `class`, `contentClass`; the glow colour is `--magic-card-glow` set on `class`.
- `marquee` — Marquee
- `progressive-blur` — ProgressiveBlur
- `reveal` — InView, AnimatedGroup, TextEffect, observeInView, RevealPreset, RevealPer
- `shader-gradient` — ShaderGradient, ShaderGradientProps, ShaderGradientUniforms
- `spotlight` — Spotlight
- `theme-toggle` — ThemeToggle. Props: `isDark`, `mode` (`light`, `dark`, `system`; swaps in the Monitor icon), `onToggle`, `variant` (`outline`, `ghost`, `inverted`, `slide`; `inverted` boolean is an alias; `slide` is a pill with a moving thumb, coloured by `--theme-toggle-thumb-light`, `--theme-toggle-thumb-dark`, `--theme-toggle-track`, `--theme-toggle-glow` and friends set on `class`), `size`, `label`, `title`, `skipTransition`, `class`. `revealTheme(event, apply, { skip, duration, easing })` is the circular wipe on its own: `import { revealTheme } from "@heyramzi/ui/lib/theme-transition.js"` (every `./lib` subpath ends in `.js`, though the source is `.ts`).

## Animations (`src/animations`)

- `avatar-group-hover` — keyframe utilities
- `card-tilt` — keyframe utilities
- `digit-pop-in` — keyframe utilities
- `dropdown` — keyframe utilities
- `input-clear-dissolve` — keyframe utilities
- `input-shake` — keyframe utilities
- `learn-more-hover` — keyframe utilities
- `like-button` — keyframe utilities
- `modal` — keyframe utilities
- `page-side-by-side` — keyframe utilities
- `plus-menu-morph` — keyframe utilities
- `resize` — keyframe utilities
- `shimmer-text` — keyframe utilities
- `spinning-counter` — keyframe utilities
- `success-check` — keyframe utilities
- `text-swap` — keyframe utilities
- `thinking-states` — keyframe utilities

## AI and chat (`src/ai`)

Imported from `@heyramzi/ui/ai/<name>`, e.g. `import { AiButton } from "@heyramzi/ui/ai/ai-button"`.

- `ai-button` — AiButton
- `confirmation` — Confirmation, ConfirmationTitle, ConfirmationState (`when` names the kind it shows), ConfirmationActions, ConfirmationAction, type ConfirmationKind
- `generation-progress` — GenerationProgress
- `loading-state` — PixelLoader
- `prompt-input` — PromptInput, PromptInputBody, PromptInputToolbar, PromptInputTextarea, PromptInputSubmit
- `reasoning` — Reasoning, ReasoningTrigger, ReasoningContent
- `response` — Response
- `suggestion` — Suggestion, Suggestions
- `typing-dots` — TypingDots. A `label` makes it a `role="status"` line
- `voice-waveform` — VoiceWaveform

## Record (`src/record`)

- `info-list` — InfoList. An editable label and value `<dl>`; `layout="row"` makes it a read-only band of items that wrap and truncate, with `term`, `content` and `action` snippets per row and a `trailing` snippet after the list
- `record-rail` — RecordRail, RecordRailTab. A record's side rail split into tabs (fields in one, a comment thread in the next), each with an optional count. A single tab draws no strip

---

Skipped on purpose: brand assets (logos, marks, brand renderer), kanban, list, gantt and status (they live in `@heyramzi/ui/work`), and charts
(they live in `@heyramzi/ui/charts`). The bot avatars
are in `src/agents`, imported from `@heyramzi/ui/agents`.
