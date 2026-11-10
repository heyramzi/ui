### Breaking changes

`node ~/Studio/vibe-kit/scripts/ui-upgrade-codemod.mjs <dir>` rewrites the mechanical cases and lists the rest.

* Kit CSS sits in Tailwind's `components` layer. A class you pass to a kit part now beats the part's own styles, so a stale `bg-*`, `rounded-*` or `p-*` left on a kit part will show. Screenshot your main pages after the bump.
* Change callbacks are `on<Prop>Change`: `onValueChange` on `StarRatingInput` and `TagsInput`, `onContentChange` on `RichEditor` and `DocEditorPage`, `onDocChange` on `InlineEditor`, `onTitleChange` for `ontitle`, `onIndexChange` on `Deck`, `onModeChange` on `ThemeProvider`, `onDatesChange` on `TaskGantt`, `onHoveredIndexChange` on `Legend` and `RingChart`, `onShowAuthorNamesChange` on `EditedChip`.
* `SidePanel` takes `onOpenChange(open)` in place of `onClose()`.
* Every other callback is camelCase: `onSelect`, `onRemove`, `onCopyLink`, `onExit`, `onReady`, `onVerdict` and the `DocMenu` actions (`onMove`, `onDelete` and the rest).
* The package root is gone. Import effects from `./effects/<name>`, all as named exports: `import { Marquee } from "@heyramzi/ui/effects/marquee"`. `./border-beam` and `./theme-toggle` are gone too.
* The flat `./ai` barrel is gone. Each part comes from its folder: `./ai/prompt-input`, `./ai/confirmation`, `./ai/typing-dots` and the rest.
* One path per name: `DataPanel` is `DetailPanel` from `./components/list-page`, `SectionLabel` comes from `./components/section-header`, `CountChip` from `./components/chip`, `ToolbarSearch` from `./components/list-page`, `revealTheme` from `./lib/theme-transition.js`, `PILL_TINT` is `TONE_TINT` from `./lib/tone.js`, `tryCatch` comes from `./lib/result.js`, and the `Inbox*` types, `InboxItem` and `InboxVerdict` come from `./work/inbox`.
* `./work/kanban`, `./work/list`, `./work/gantt`, `./work/time`, `./work/detail`, `./editor/serializer`, `./onboarding/stores` and `./lib/*` without `.js` are gone. Use `./work`, `./editor`, `./onboarding` and `./lib/<name>.js`.
* The demos left the package: `./work/demo`, `./work/docs-demo.svelte`, `./work/detail-demo.svelte`, `./record/demo.svelte`, `./slides/demo`, `./slides/demo-slides`, `./onboarding/demo` and `./agents/demo.svelte`. They live on the docs site.
* `./design` now loads the same craft and primitives CSS as `./tokens.css`, without the palette. Radii step 6, 10, 14, 18 and 22px, so controls, cards and overlays round a little more.
* The Sidebar shortcut moved from Cmd/Ctrl+S to Cmd/Ctrl+B, and it no longer fires while you type in a field.
* `StarRatingInput` is one slider on Bits UI's `RatingGroup`: arrow keys change the value and report each step, so don't move to the next screen on the first change.
* `.shadow-soft*` are Tailwind utilities, so `hover:shadow-soft-md` works.

### Accessibility

* Hold to confirm completes with Space or Enter held, and a screen reader's activate arms it, then confirms on a second press.
* Kanban, task list, gantt, thread, triage and the list page keep focus after a move, save, delete or close, and announce the result.
* Charts are named and summarised, hold a hidden data table and step their tooltip with the arrow keys.
* The picker's keys work without its search box, every tag in the tags input is removable from the keyboard, sortable headers hold a real button, and row menus open with Shift+F10.
* Every decorative icon is hidden from screen readers, and code blocks use the `light-plus` and `dark-plus` themes with a 4.5:1 contrast floor.
