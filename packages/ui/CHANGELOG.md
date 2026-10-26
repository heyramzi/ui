# Changelog

## Unreleased

### Breaking changes

* feat(ui)!: `./tasks` is now `./work`, since the module holds docs as well as tasks, and no `./tasks` subpath resolves. Swap `@heyramzi/ui/tasks` for `@heyramzi/ui/work` (`/kanban`, `/list`, `/gantt`, `/time`, `/inbox`, `/detail`, `/presets/sales` keep their tails). The moved names leave it: `StatusBadge`, `StatusDot`, `StatusIcon`, `defineStatuses` and their types come from `@heyramzi/ui/status`, `SidePanel` and `PanelStat` from `@heyramzi/ui/panel`, the record shell from `@heyramzi/ui/record`. `tasks/status` → `import { StatusBadge } from "@heyramzi/ui/status"`, `tasks/status-dot` → `{ StatusDot }`, `tasks/statuses` → `{ defineStatuses }`, `tasks/side-panel` → `import { SidePanel } from "@heyramzi/ui/panel"`, `tasks/record-demo.svelte` → `record/demo.svelte`. The site page moved from `/tasks` to `/work`, and `/tasks` redirects
* feat(ui)!: `./lib/*` resolves real files with types, and takes `.js` or no extension: `@heyramzi/ui/lib/layout.js`
* feat(ui)!: remove `lib/utils.ts`; import `cn`, `WithElementRef`, `WithoutChildren`, `Result` and `tryCatch` from `@heyramzi/utils`, and drop `clsx` and `tailwind-merge` as direct dependencies
* feat(ui)!: remove `Composer` and the `./ai` export `ComposerProps`; `PromptInput` takes its `error` and `accent`, and puts a leading control or a header inside `PromptInputBody`
* feat(ui)!: remove `viewTransitionReveal` and `animations/view-transition-reveal.ts`; `revealTheme` takes a click, an element or an `{ x, y }` point and injects the view-transition reset itself, so `ThemeToggle.css` no longer carries it
* feat(ui)!: remove the animation files `tabs-sliding`, `tooltip`, `accordion`, `skeleton-reveal`, `notification-badge`, `reasoning-stream`, `streaming-text`, `texts-reveal`, `icon-swap` and `panel`, since a component already owns each motion; the sheet slide is now `shadcn/sheet/sheet.css`, which the sheet imports itself
* feat(ui)!: `shadcn/calendar` defaults to `weekStartsOn={1}` and `fixedWeeks`, so weeks start on Monday and every month draws six rows
* feat(ui)!: `shadcn/code-block` `CopyButton` renders the shared copy control, so `size` is `default`, `md` (the default here) or `sm`, `variant` is `ghost` or `outline`, and the check holds for 1.4s instead of 2s
* feat(ui)!: `shadcn/alert` takes `role`, so a calm message can pass `status`
* feat(ui)!: `ImageComparison` drops `start`; the handle begins at `position` (default 50), and `hover` returns to that first value
* feat(ui)!: remove the `./lib/*.ts` export, so `@heyramzi/ui/lib/theme-transition.ts` no longer resolves; drop the extension or write `.js`
* feat(ui)!: `@lucide/svelte` is no longer a dependency; the breadcrumb, calendar, message scroller, radio group, sonner, trace, theme toggle and the showcase demos draw Phosphor icons, so a toast or a radio dot may sit a pixel differently

### Features

* feat(ui): `shadcn/progress` takes `tone`, the fill's colour on the severity scale; `shadcn/button` has a `text` variant for quiet text that opens an editor, which wraps to its lines and keeps a 44px touch height; `SegmentedFilter` takes `max="none"` to never fold a tail into a menu
* feat(ui): `CopyButton` takes `variant="inline"` for a chip that sits in running text (the font and colour are the surrounding text's, the icon trails), and `announce="name"` to swap the button's own name to `copiedLabel` instead of a live region
* feat(ui): `shadcn/accordion` `AccordionTrigger` takes an `indicator` snippet that replaces the caret
* feat(ui): `lib/panel` exports `insetWellClass`, the inset well for a control block inside a panel
* feat(ui): `components/segmented`, one bordered track for tabs, a filter or nav links: `AnimatedTabs`, `SegmentedFilter`, `SegmentedNav`, `SectionRuns`, with a sliding pill on `lib/sliding-pill` and an overflow menu past six segments
* feat(ui): `components/picker` (`Picker`, `MarkPicker`), `components/mark`, `components/icon`
* feat(ui): `components/copy` (`CopyButton`, `copyText`, `copyRichText`, `Copied`), with a default accessible name
* feat(ui): `components/data-table`, `components/list-page` (a master-detail page kit; the section strip comes from `setSectionHost`), `components/hold-to-confirm`, `components/star-rating-input`, `components/svg`, `components/language-flag`, `components/locale-switch`
* feat(ui): `effects/theme-toggle` takes `variant="slide"`, a pill track with a thumb that moves between a sun and a moon, coloured by `--theme-toggle-*` custom properties on `class`
* feat(ui): `effects/magic-card`, a frosted card with a glow that follows the pointer, coloured by `--magic-card-glow`
* feat(ui): `components/open-in`, a link out to a tool that takes the tool's name, label and mark as a prop
* feat(ui): `effects/interactive-hover-button`, `ai/ai-button` and `ai/generation-progress`
* feat(ui): `shadcn/field` `SimpleField`: a label, a hint or an error and the control, with the message tied to the control by `aria-describedby`
* feat(ui): `shadcn/command` exports `computeCommandScore`
* feat(ui): `lib/tone` (`Tone`, `TONE_CLASS`, `TONE_TEXT`, `TONE_ICON`, `TONE_COLOR`)
* feat(ui): `shadcn/badge` takes `tone` (neutral, accent, info, success, warning, destructive), an outlined chip read from `TONE_CLASS`; it ignores `variant`
* feat(ui): `effects/reveal` exports the `onInView` action, which calls `onEnter` and `onLeave` as a node crosses the viewport, with `amount`, `margin` and `once`
* feat(ui): `effects/marquee` takes `speed` (px/s, measured from the track), `fade` (edge masks), `delay`, `style` and `overflowOnly`, which scrolls a line of text only while it is wider than its box; the repeated copies are `aria-hidden`
* feat(ui): `AnimatedTabs` takes `variant="underline"`: bare labels over a hairline with a travelling rule (colour it with `--segmented-rule`), the same height and overflow menu as the pill; a segment takes a `badge` note such as "Save 20%"
* feat(ui): `ImageComparison` takes a bindable `position`, `beforeBadge` and `afterBadge` snippets with `badgeEdge`, picture `sources` with `width` and `height` on each side, `eager` loading, a `hint` sweep on mount and brand hooks for the handle and grip (`--hr-compare-*`); the grip draws chevrons, the range steps by 1 and a vertical swipe still scrolls
* feat(ui): `NoticeBar` and the list-page empty states are built on `shadcn/alert` and `shadcn/empty`
* feat(ui): every busy state renders `shadcn/spinner`: the toast loader, the prompt submit and infinite scroll
* feat(rich-editor): new package `@heyramzi/rich-editor` 0.1.0, the Tiptap editor, renderer and Markdown bridge that were inside an app; a comparison table's winner cell carries `data-winner` as the first word of the cell, and a host colours its own products

### Touch and contrast

* feat(ui): on a coarse pointer every control a list page's toolbar draws is 44px: `Input`, `ToolbarSearch`, `toolbarTriggerClass` (the Filters and Display triggers), `Picker` triggers and the pill and underline tracks of `components/segmented`. The pill track keeps its look: the border becomes a ring drawn over a 44px well, and the sliding pill keeps its gap inside it
* feat(ui): `Checkbox` hit box is 44px on a coarse pointer (it was 38px)
* feat(ui): a link inside a `TableCell` gets a 44px hit area on a coarse pointer, unless the link positions itself
* feat(ui): `TableCell` sets `tabular-nums`, so a date or price column lines up in every table
* feat(ui): tokens `--color-cat-cyan-ink`, `-teal-ink`, `-purple-ink`, `-amber-ink`, `--color-success-ink` and `--color-destructive-ink` (text and icon colours that clear AA on their own tint in both themes), so `text-destructive-ink` is a utility
* fix(ui): the destructive `Badge` variant and the destructive tone chip use `text-destructive-ink` (3.6:1 became 4.5:1 or better)
* fix(ui): the sidebar group label is `text-sidebar-foreground/90` (3.3:1 at 70%)
* fix(ui): `SortableHead`'s unsorted caret is `text-muted-foreground/75` (2.3:1 at 50%, an icon needs 3:1)

### New components

* feat(ui): `components/theme` (`ThemeProvider`, and `mode`, `userPrefersMode`, `setMode`, `toggleMode`, `resetMode` from mode-watcher), the one light and dark system: mount the provider once, no cookie or boot script; `initial` seeds a browser with nothing stored and `onChange` fires on a person's choice so an app can save it on its server
* fix(ui): `shadcn/dropdown-menu` and `shadcn/context-menu` separators hide when they lead, trail or follow another separator, so a conditional group that draws nothing no longer leaves a double line
* feat(ui): `components/section-card` (`SectionCard`), `components/section-header` (`SectionHeader`), `components/field-row` (`FieldRow`) and `components/table-view` (`TableView`), the settings and read-only table pieces apps kept rewriting
* feat(ui): `components/docs` (`DocPage`, `OnThisPage`, `ScrollSpy`), one page anatomy for documentation

## [1.45.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.44.1...ui-v1.45.0) (2026-10-01)

_Released as 4.5.0 before the 19 Oct 2026 renumbering._


### Features

* **claude:** add claude skills and references ([29137b5](https://github.com/heyramzi/vibe-kit/commit/29137b591a75e24fb2204740b793f063764fe2f3))
* **packages:** devtools, review ui, and studio library ([c0beedf](https://github.com/heyramzi/vibe-kit/commit/c0beedffd09b1e482e565e61fe498a15542ece7c))

## [1.44.1](https://github.com/heyramzi/vibe-kit/compare/ui-v1.44.0...ui-v1.44.1) (2026-09-29)

_Released as 4.4.1 before the 19 Oct 2026 renumbering._


### Bug Fixes

* **ui:** chart hover band centers on the dot and reaches a little less far ([0355693](https://github.com/heyramzi/vibe-kit/commit/03556939d411eff5c4538c622aac78affbc6d74d))

## [1.44.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.43.0...ui-v1.44.0) (2026-09-26)

_Released as 4.4.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** FaceIcon is Neuro, the bot-avatars face whose eyes read while it works ([a48c4d9](https://github.com/heyramzi/vibe-kit/commit/a48c4d9d6dfd11e63a734bdb41aa3a8f11c3d804))


### Bug Fixes

* **lint:** clear the errors that blocked every push ([e1f2ef7](https://github.com/heyramzi/vibe-kit/commit/e1f2ef7f8124a43d070f4d49178074c1a21887cf))

## [1.43.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.42.1...ui-v1.43.0) (2026-09-22)

_Released as 4.3.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** chart hover matches bklit-ui, and the line stops jittering ([8dc4354](https://github.com/heyramzi/vibe-kit/commit/8dc43549dc2c6b60688f48d5a87eabced1ad5627))

## [1.42.1](https://github.com/heyramzi/vibe-kit/compare/ui-v1.42.0...ui-v1.42.1) (2026-09-22)

_Released as 4.2.1 before the 19 Oct 2026 renumbering._


### Bug Fixes

* **ui:** publish with relative imports, so Vite consumers resolve the package ([838678c](https://github.com/heyramzi/vibe-kit/commit/838678c999fb15f7f11656ed4a6f2b17add9791d))

## [1.42.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.41.0...ui-v1.42.0) (2026-09-22)

_Released as 4.2.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** charts enter on one reveal, a faded crosshair and a springier tooltip ([989da69](https://github.com/heyramzi/vibe-kit/commit/989da693e639cef2e0513664b88f3b36eae88b08))

## [1.41.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.40.0...ui-v1.41.0) (2026-09-22)

_Released as 4.1.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** BarChart stacks series and colors each bar by its band ([cdeb958](https://github.com/heyramzi/vibe-kit/commit/cdeb958c50e4f5e1e661aae59d15b04dac5b53f1))


### Bug Fixes

* gate after path aliases ([f76b88a](https://github.com/heyramzi/vibe-kit/commit/f76b88ab65462d36083b0c92d1dbf5769e7b670d))

## [1.40.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.39.0...ui-v1.40.0) (2026-09-16)

_Released as 4.0.0 before the 19 Oct 2026 renumbering._


### ⚠ BREAKING CHANGES

* **ui:** LineChart no longer takes `fill` and Sparkline no longer takes `area`; delete the prop, the gradient is always drawn. `edgeFade` still controls the soft ends.

### Features

* **ui:** every LineChart and Sparkline draws its gradient fill ([d69ea5c](https://github.com/heyramzi/vibe-kit/commit/d69ea5c6af7b7cc8c0b649f306de42ca4ab0447f))

## [1.39.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.38.0...ui-v1.39.0) (2026-09-16)

_Released as 3.1.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** 24 symbols the Wavenote library and iPhone replicas draw, read off the Mac ([ecf0683](https://github.com/heyramzi/vibe-kit/commit/ecf06837271f8dda5408b73ae7ffe501611dcd21))


### Bug Fixes

* **ui:** oxfmt ne compte plus comme une retouche dans le sync ([51ebecc](https://github.com/heyramzi/vibe-kit/commit/51ebecc1815a26b71b15813c6b542ff2b9faa045))

## [1.38.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.37.0...ui-v1.38.0) (2026-09-14)

_Released as 3.0.0 before the 19 Oct 2026 renumbering._


### ⚠ BREAKING CHANGES

* **ui:** le kit change d'aspect. Les hauteurs, les ombres, les rayons et les icônes sont ceux d'upsys; un consommateur doit importer `@heyramzi/ui/design` et ajouter `@source "../node_modules/@heyramzi/ui/src";` à son app.css, sans quoi Tailwind ne génère aucune de ces classes.

### Features

* **ui:** le kit shadcn d'upsys monte ici, et upsys le réexporte ([f4d71e0](https://github.com/heyramzi/vibe-kit/commit/f4d71e03c7d651c94566af196e956d33cb441fef))

## [1.37.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.36.0...ui-v1.37.0) (2026-09-14)

_Released as 2.1.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** les trente-deux transitions gratuites et les scripts de synchronisation ([34ea17b](https://github.com/heyramzi/vibe-kit/commit/34ea17b7f9a8fffbbd2f882040fddc76298839ca))
* **ui:** the showcase holds the whole package, and the shadcn demos arrive by script ([3f5d300](https://github.com/heyramzi/vibe-kit/commit/3f5d300d163eab7c2d6f11d6304aa2197e043b23))

## [1.36.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.35.1...ui-v1.36.0) (2026-09-11)

_Released as 2.0.0 before the 19 Oct 2026 renumbering._


### ⚠ BREAKING CHANGES

* **ui:** `@heyramzi/ui/chat` n'exporte plus Message, MessageContent, MessageAvatar, MessageActions, MessageAction ni MessageCopy. Le remplacement est `@heyramzi/ui/shadcn/message` plus `@heyramzi/ui/shadcn/bubble` : `from="self"` devient `align="end"` et la bulle passe en `variant="default"`, `from="other"` devient `align="start"` en `variant="muted"`. Conversation, Composer et TypingDots ne bougent pas.
* **ui:** Button and InputGroup.Button no longer take `size="icon"`, `size="icon-sm"`, `size="icon-lg"`, `size="icon-xs"` or `size="cta"`; use the nearest height with the new `icon` prop (`size="sm" icon`). Button drops the `gradient`, `secondary` and `link` variants, and Sheet.Content drops `side="top"`.

### Features

* **ui:** a component offers three variants, not eight ([6e989e3](https://github.com/heyramzi/vibe-kit/commit/6e989e3d1a35d8f89dcb281ab60bc493196e7782))
* **ui:** six motion-primitives ports, written as CSS ([b0061a9](https://github.com/heyramzi/vibe-kit/commit/b0061a9340d4acfc95c3289b1805b54f41c508c7))
* **ui:** the shadcn Message and Bubble replace the in-house chat set ([3682da6](https://github.com/heyramzi/vibe-kit/commit/3682da6ecbdbf6a2ccfcbb4bedfd63dca2133c85))


### Bug Fixes

* **descript:** layout cards prints where a card stands, not where its paragraph starts ([97b85fd](https://github.com/heyramzi/vibe-kit/commit/97b85fdf3a50e5d919acedf5cf82799cc53bbcd5))
* **ui:** a static-colour beam keeps its brightness and saturation ([f85b5e6](https://github.com/heyramzi/vibe-kit/commit/f85b5e63847330f8b42a4c1cdaf4de2f6e58f9f0))

## [1.35.1](https://github.com/heyramzi/vibe-kit/compare/ui-v1.35.0...ui-v1.35.1) (2026-09-06)

_Released as 1.0.1 before the 19 Oct 2026 renumbering._


### Bug Fixes

* **ui:** a static-colour beam keeps its brightness and saturation ([f85b5e6](https://github.com/heyramzi/vibe-kit/commit/f85b5e63847330f8b42a4c1cdaf4de2f6e58f9f0))

## [1.35.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.34.0...ui-v1.35.0) (2026-09-05)

_Released as 1.0.0 before the 19 Oct 2026 renumbering._


### ⚠ BREAKING CHANGES

* **ui:** Button and InputGroup.Button no longer take `size="icon"`, `size="icon-sm"`, `size="icon-lg"`, `size="icon-xs"` or `size="cta"`; use the nearest height with the new `icon` prop (`size="sm" icon`). Button drops the `gradient`, `secondary` and `link` variants, and Sheet.Content drops `side="top"`.

### Features

* **ui:** a component offers three variants, not eight ([6e989e3](https://github.com/heyramzi/vibe-kit/commit/6e989e3d1a35d8f89dcb281ab60bc493196e7782))
* **ui:** six motion-primitives ports, written as CSS ([b0061a9](https://github.com/heyramzi/vibe-kit/commit/b0061a9340d4acfc95c3289b1805b54f41c508c7))


### Bug Fixes

* **descript:** layout cards prints where a card stands, not where its paragraph starts ([97b85fd](https://github.com/heyramzi/vibe-kit/commit/97b85fdf3a50e5d919acedf5cf82799cc53bbcd5))

## [1.34.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.33.0...ui-v1.34.0) (2026-08-30)

_Released as 0.42.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** the chart a single figure gets ([91192ea](https://github.com/heyramzi/vibe-kit/commit/91192ea4ed7f9d386e417f067ceba00dcf1eff6b))

## [1.33.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.32.1...ui-v1.33.0) (2026-08-28)

_Released as 0.41.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** the AI kit is one item per row, and ten more of them ([d1c6628](https://github.com/heyramzi/vibe-kit/commit/d1c66287e953ec9a36ec606316c87dc5d0389d6c))

## [1.32.1](https://github.com/heyramzi/vibe-kit/compare/ui-v1.32.0...ui-v1.32.1) (2026-08-27)

_Released as 0.40.1 before the 19 Oct 2026 renumbering._


### Bug Fixes

* **ui:** the showcase rail drops its rule, and search results number from one ([6f48f1f](https://github.com/heyramzi/vibe-kit/commit/6f48f1f9b9bc86316a865f17e2551fcfd5a24636))

## [1.32.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.31.0...ui-v1.32.0) (2026-08-26)

_Released as 0.40.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** the AI showcase is one grid, and coloured text clears AA ([3d47638](https://github.com/heyramzi/vibe-kit/commit/3d476388f1b5f396445aedeb3675e4539da5e608))

## [1.31.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.30.0...ui-v1.31.0) (2026-08-26)

_Released as 0.39.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** the craft layer ships in the package, and the showcase gets its shell ([31d1036](https://github.com/heyramzi/vibe-kit/commit/31d1036ca301953ca3ac2e9a2efcf7cc4cf357c8))

## [1.30.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.29.2...ui-v1.30.0) (2026-08-25)

_Released as 0.38.0 before the 19 Oct 2026 renumbering._


### Features

* **skool:** the rules endpoints, and the cover design language ([ab7019b](https://github.com/heyramzi/vibe-kit/commit/ab7019b1046f30f1148bfa190e6bf9c060299aae))


### Bug Fixes

* **ui:** deep-import phosphor icons instead of the barrel ([882f19b](https://github.com/heyramzi/vibe-kit/commit/882f19be2a89373a979ca9355a4449d381f92b37))
* **ui:** the shader field frames itself with a long lens, and the skill learns the fifth artifact ([e2a8a6e](https://github.com/heyramzi/vibe-kit/commit/e2a8a6e1cb1a47db643d6ee01a5811c24093b305))

## [1.29.2](https://github.com/heyramzi/vibe-kit/compare/ui-v1.29.1...ui-v1.29.2) (2026-08-19)

_Released as 0.37.2 before the 19 Oct 2026 renumbering._


### Bug Fixes

* **ui:** shadcn/chart points at the maintained primitives instead of rotting ([#113](https://github.com/heyramzi/vibe-kit/issues/113)) ([6f0eba5](https://github.com/heyramzi/vibe-kit/commit/6f0eba54b1e8269709f835a523eb71ae2e261174))

## [1.29.1](https://github.com/heyramzi/vibe-kit/compare/ui-v1.29.0...ui-v1.29.1) (2026-08-19)

_Released as 0.37.1 before the 19 Oct 2026 renumbering._


### Bug Fixes

* **ui:** form fields bind again, because the snippet gave a value where a store was expected ([e3b5e49](https://github.com/heyramzi/vibe-kit/commit/e3b5e49ced2823827dd1c2d719cab24d215cb858))

## [1.29.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.28.0...ui-v1.29.0) (2026-08-19)

_Released as 0.37.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** area fills dissolve at the plot edges instead of stopping flat ([#110](https://github.com/heyramzi/vibe-kit/issues/110)) ([0bab0c1](https://github.com/heyramzi/vibe-kit/commit/0bab0c13f330ef43ed7eb232401539c1989ff9f2))

## [1.28.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.27.3...ui-v1.28.0) (2026-08-17)

_Released as 0.36.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** export the ports board and the showcase components ([7e9f219](https://github.com/heyramzi/vibe-kit/commit/7e9f219be131c86f0ddc8e9ea43e3065907c559a))
* **ui:** recover the animation, effects, AI and chart showcase ([369287b](https://github.com/heyramzi/vibe-kit/commit/369287be1f903534697923be391f0dbac10611dd))

## [1.27.3](https://github.com/heyramzi/vibe-kit/compare/ui-v1.27.2...ui-v1.27.3) (2026-08-16)

_Released as 0.35.3 before the 19 Oct 2026 renumbering._


### Bug Fixes

* **ui:** a lost WebGL context drops the field instead of painting it black ([b606568](https://github.com/heyramzi/vibe-kit/commit/b606568f8d3dbde2f615d4583776118793991767))

## [1.27.2](https://github.com/heyramzi/vibe-kit/compare/ui-v1.27.1...ui-v1.27.2) (2026-08-16)

_Released as 0.35.2 before the 19 Oct 2026 renumbering._


### Bug Fixes

* **ui:** the shader gradient stops drawing hard lines across itself ([36c0c08](https://github.com/heyramzi/vibe-kit/commit/36c0c0870c89592ce18a84b827582722682b468f))

## [1.27.1](https://github.com/heyramzi/vibe-kit/compare/ui-v1.27.0...ui-v1.27.1) (2026-08-16)

_Released as 0.35.1 before the 19 Oct 2026 renumbering._


### Bug Fixes

* **ui:** the shader gradient covers a wide frame ([38fe85c](https://github.com/heyramzi/vibe-kit/commit/38fe85c6f7a68e340c1cf4472aa5ce3146fac237))

## [1.27.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.26.0...ui-v1.27.0) (2026-08-16)

_Released as 0.35.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** a shader gradient that carries no three.js ([b2bee9e](https://github.com/heyramzi/vibe-kit/commit/b2bee9e18f9c23bf7d0f98090818282ac10c6762))

## [1.26.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.25.0...ui-v1.26.0) (2026-08-10)

_Released as 0.34.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** note.text and record.circle, the two symbols the Notes panes wear ([#95](https://github.com/heyramzi/vibe-kit/issues/95)) ([636b150](https://github.com/heyramzi/vibe-kit/commit/636b150dede632d3c2a68bd58697d0ab57437329))

## [1.25.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.24.0...ui-v1.25.0) (2026-08-10)

_Released as 0.33.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** macwindow and character.bubble.fill, read off the Mac ([a107de9](https://github.com/heyramzi/vibe-kit/commit/a107de923f6a1ffe7d8f684e24fe91e33d45b070))

## [1.24.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.23.3...ui-v1.24.0) (2026-08-10)

_Released as 0.32.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** SF-named icons, drawn here rather than exported ([808f1b7](https://github.com/heyramzi/vibe-kit/commit/808f1b7fb3f538d4e0d43fc7537a04658b0b6613))
* **ui:** the icons are Apple's own, and the note says why that changed ([73ced3e](https://github.com/heyramzi/vibe-kit/commit/73ced3e0941db91010161a6ffa08cbf76bcc46eb))
* **ui:** the symbol table is importable on its own ([e2e7a67](https://github.com/heyramzi/vibe-kit/commit/e2e7a675ee0414a76f88f391d86d6411d3d2762d))

## [1.23.3](https://github.com/heyramzi/vibe-kit/compare/ui-v1.23.2...ui-v1.23.3) (2026-06-17)

_Released as 0.31.3 before the 19 Oct 2026 renumbering._


### Bug Fixes

* **ui:** ship chat/ai/effects styles as plain CSS instead of &lt;style&gt; blocks ([#67](https://github.com/heyramzi/vibe-kit/issues/67)) ([1261471](https://github.com/heyramzi/vibe-kit/commit/126147103cc21654d8b7008729ad5da61faf3638))

## [1.23.2](https://github.com/heyramzi/vibe-kit/compare/ui-v1.23.1...ui-v1.23.2) (2026-06-17)

_Released as 0.31.2 before the 19 Oct 2026 renumbering._


### Bug Fixes

* **ui:** ship chart styles as plain CSS instead of &lt;style&gt; blocks ([#64](https://github.com/heyramzi/vibe-kit/issues/64)) ([237a155](https://github.com/heyramzi/vibe-kit/commit/237a155a64b8278c0ac677f4bf6cd301327900e7))

## [1.23.1](https://github.com/heyramzi/vibe-kit/compare/ui-v1.23.0...ui-v1.23.1) (2026-06-17)

_Released as 0.31.1 before the 19 Oct 2026 renumbering._


### Bug Fixes

* **ui:** show period in chart tooltips + fix hover tracking ([a73d560](https://github.com/heyramzi/vibe-kit/commit/a73d56007d3f0d4f12f359e06e92c3c37fab1cc1))

## [1.23.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.22.1...ui-v1.23.0) (2026-06-16)

_Released as 0.31.0 before the 19 Oct 2026 renumbering._


### Features

* **packages:** add descriptions to ai, auth, marketing, ui, utils manifests ([2e6630b](https://github.com/heyramzi/vibe-kit/commit/2e6630be49a6b97ec505e1bf6b8f011a4eaf5627))
* **ui:** add @heyramzi/ui/chat human-chat module, slim ai/ to AI-only ([ac0f4ce](https://github.com/heyramzi/vibe-kit/commit/ac0f4ce5ecd260c0c70f0f70ac16f71870c3de55))
* **ui:** add ai subpath with chat primitives ([9683760](https://github.com/heyramzi/vibe-kit/commit/96837605e10590a1a416aa7c55429b5cd7b9a2b3))
* **ui:** add AnimatedBeam, Spotlight, Marquee, ImageReveal effects ([97fbb4e](https://github.com/heyramzi/vibe-kit/commit/97fbb4e170a58f0e3796a2e3ac2a258e1b809213))
* **ui:** add charts subpath with layerchart wrappers ([f90de43](https://github.com/heyramzi/vibe-kit/commit/f90de43f8fb6271847fcc13d6d03a8c267fd2c24))
* **ui:** add gauge, ring, legend charts and theme the tooltip ([d3d9135](https://github.com/heyramzi/vibe-kit/commit/d3d91350f0afd1c7aaa2a4acdf148808f2eb7ddc))
* **ui:** add height="fill" to BarChart ([5b0a349](https://github.com/heyramzi/vibe-kit/commit/5b0a3491cbc7f60c62a64350ec753ee0fff1f473))
* **ui:** add shadcn-svelte primitives under @heyramzi/ui/shadcn/* ([4ea5ad0](https://github.com/heyramzi/vibe-kit/commit/4ea5ad0635dd12aa1714b6a59108d09c7e24de43))
* **ui:** add StatCard charts block, standalone Legend demo, shared chart tokens ([39ca7d0](https://github.com/heyramzi/vibe-kit/commit/39ca7d074b638565e538b40524b044b6dd9fe3d5))
* **ui:** add StatCard gauge variant (figure left, gauge right) (0.29.0) ([289cd09](https://github.com/heyramzi/vibe-kit/commit/289cd0965bcbec0483cd5d6b87c0ae3b0b60b624))
* **ui:** add ThemeToggle with view-transition reveal ([b212e40](https://github.com/heyramzi/vibe-kit/commit/b212e40e4e47f09b8b12d5d0cd507f24d926c7a5))
* **ui:** BorderBeam bloom + offscreen-pause props, reduced-motion respect ([de4de48](https://github.com/heyramzi/vibe-kit/commit/de4de4819e9bc81b8fcf058dd921068ede8ee834))
* **ui:** commit forms primitives + bump to 0.7.0 ([bfde6e8](https://github.com/heyramzi/vibe-kit/commit/bfde6e8b8d6a016970ab6efe72d16af88276074e))
* **ui:** make chat the single source for conversation container + dots + avatar ([23bbb04](https://github.com/heyramzi/vibe-kit/commit/23bbb049a63ab8978e5a4b329734814c3445b729))
* **ui:** rewrite charts with primitive composition + add transitions.dev animations ([959f2f6](https://github.com/heyramzi/vibe-kit/commit/959f2f6906a551d096d64bd5e728ae56fa831f51))
* **ui:** sheet animation, dropdown delayed-open, dialog/alert refinements ([b0bc699](https://github.com/heyramzi/vibe-kit/commit/b0bc69918ded03d44040c8ec8254a756a2f011d9))
* **ui:** thread BorderBeam colors prop through gradient helpers (0.14.0) ([7235d34](https://github.com/heyramzi/vibe-kit/commit/7235d34225cc619ba3dee025281aa63e87640f1d))
* **ui:** unify chart headers on Figure, centralize layerchart chrome (0.28.0) ([2a84b4b](https://github.com/heyramzi/vibe-kit/commit/2a84b4b3c9bf4db01ad7df1d293b9e94b6927f33))


### Bug Fixes

* **ci:** make release-please changelog-path package-relative ([af35ed4](https://github.com/heyramzi/vibe-kit/commit/af35ed48c39349ec1581073be236c24d675e94d4))
* **ui:** add style condition to ./animations export for rolldown CSS resolution ([b759478](https://github.com/heyramzi/vibe-kit/commit/b75947847bdf07c3c87b7298cdabc6aabe3d3097))
* **ui:** align icon-swap demo markup with package CSS contract; pick up bar/area chart polish ([edefa61](https://github.com/heyramzi/vibe-kit/commit/edefa619e7681744868cd40c83eb1d68c2167ba5))
* **ui:** anchor FaceIcon thinking gradient at top and dissolve cone edge ([6ef356d](https://github.com/heyramzi/vibe-kit/commit/6ef356dec207ceb30b06881d78a002d5d9a42766))
* **ui:** blur thinking-state brain overlay so gradient feels softer ([362285f](https://github.com/heyramzi/vibe-kit/commit/362285f4ffc7aaeda98610c87f47960d37fe2f1f))
* **ui:** brand-color stat-card hover dot, snap to cursor, tighten edge fade ([10c8946](https://github.com/heyramzi/vibe-kit/commit/10c8946588e762ac609c32107082db056f209026))
* **ui:** drop isolation+contain from BorderBeam host (0.14.1) ([cb67c2f](https://github.com/heyramzi/vibe-kit/commit/cb67c2fda6f675e30c19d5a5d5cfa55e9a271539))
* **ui:** drop unused colors arg from BorderBeam gradient helpers ([b89318f](https://github.com/heyramzi/vibe-kit/commit/b89318f0606f287602ffb4c9117cd4dd385f2ab7))
* **ui:** exact replica CSS for transitions.dev animations + port their dark/light demo theming ([32a42d8](https://github.com/heyramzi/vibe-kit/commit/32a42d8495c3cdc17d450751a43031eb928fd7f8))
* **ui:** import superForm from /client in use-form helper ([5cd3917](https://github.com/heyramzi/vibe-kit/commit/5cd391774d639c1a7a5df45bf0b27911d07009b1))
* **ui:** import superValidate from /server in form helpers ([8428fcd](https://github.com/heyramzi/vibe-kit/commit/8428fcdf741921cf9ee71a3d5978d579ca71be43))
* **ui:** inline Writable type in use-field-value to avoid import-type parse error in Rolldown optimizer; bump 0.7.1 ([73038a0](https://github.com/heyramzi/vibe-kit/commit/73038a0ef33a765e23f02b4d701893b211e2879d))
* **ui:** Marquee honors --duration/--gap class overrides ([2026671](https://github.com/heyramzi/vibe-kit/commit/20266715e6efd31def320b03acae3acf3788f6d1))
* **ui:** match bklit line stroke fade + smoother curve, fill the gauge on entry ([3cd920a](https://github.com/heyramzi/vibe-kit/commit/3cd920aed3453bd3bff573e32fbc040d7b28aa55))
* **ui:** narrow vaul-svelte peer to &gt;=1.0.0-next.7 only ([c88707b](https://github.com/heyramzi/vibe-kit/commit/c88707b14305dd43afa731a32a7ac3a0c4ae3860))
* **ui:** register BorderBeam [@property](https://github.com/property) values via CSS.registerProperty (0.14.2) ([95212c6](https://github.com/heyramzi/vibe-kit/commit/95212c6c762a51b09200105df80e7a3d1d090b0a))
* **ui:** relax vaul-svelte peer to accept stable 0.3.x or pre-release 1.0+ (0.15.2) ([0f3bd4c](https://github.com/heyramzi/vibe-kit/commit/0f3bd4c6d342557eb55e4b7dc5f501ea5d40341f))
* **ui:** rename Confirmation `state` prop to `kind` ([9e126dc](https://github.com/heyramzi/vibe-kit/commit/9e126dcea7bc5d41838343f59fb9dc427cc6206e))
* **ui:** replace template-expression state mutations with FieldSync component ([975d41e](https://github.com/heyramzi/vibe-kit/commit/975d41e4fe80f48bca355f001c868242fb3004d5))
* **ui:** set form context synchronously, not in $effect ([ba6ccb3](https://github.com/heyramzi/vibe-kit/commit/ba6ccb313b9276216fccd8bfa493d33cdbedaaf3))
* **ui:** untrack fieldCtx writes in form-field snippets ([94cf361](https://github.com/heyramzi/vibe-kit/commit/94cf3614c6f9d2465fd34bc18d9dee6b32dc33ed))
* **ui:** widen vaul-svelte peer to allow 1.0.0-next.7 ([776396d](https://github.com/heyramzi/vibe-kit/commit/776396dbdb1037b1ca406c29886ceee552f59212))
* **ui:** wrap form-field Label inside Control for formsnap v2 compat ([4444d7c](https://github.com/heyramzi/vibe-kit/commit/4444d7cdf7dfb7069f54632a68b491a65187249a))
* **workspace:** use workspace: protocol for cross-package peer deps ([cba21a1](https://github.com/heyramzi/vibe-kit/commit/cba21a1673444b3c0f7e3bf8d9cfebe6c0a11564))

## 1.21.0 (2026-06-14)

_Released as 0.29.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** add a gauge variant to StatCard (figure on the left, radial gauge on the right) and make StatCard's data/series props optional so a gauge card needs only a gaugeValue


## 1.20.0 (2026-06-14)

_Released as 0.28.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** add Figure and TrendPill chart modules; StatCard and the area/bar/line chart headers now compose the shared Figure so there is one KPI metric pattern across the chart system


### Improvements

* **ui:** centralize the layerchart axis, grid, and highlight chrome in charts.css so it is defined once across every chart instead of duplicated per component


## 1.19.0 (2026-06-14)

_Released as 0.27.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** add StatCard to charts: bklit-style KPI block with line, area, and bar variants, edge-to-edge chart, trend pill, count-up value, and a figureOnly bare-figure mode
* **ui:** add a standalone Legend demo and shared chart design tokens (label, grid, motion, easing, elevation) in charts.css as one source of truth


### Bug Fixes

* **ui:** animate the Legend progress bar with transform scaleX instead of width to remove layout thrash
* **ui:** StatCard line variant now fades the stroke to transparent at both ends (bklit-style gradient stroke) and uses curveBasis for a smoother line
* **ui:** gauge entry animation fills the arc by fading notches in order instead of popping each one in from the centre


## 1.18.0 (2026-06-13)

_Released as 0.26.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** make chat the single source for the conversation container, typing dots, and avatar ([23bbb04](https://github.com/heyramzi/vibe-kit/commit/23bbb049))


## 1.17.0 (2026-06-12)

_Released as 0.25.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** add the @heyramzi/ui/chat human-chat module and slim ai/ to AI-only ([ac0f4ce](https://github.com/heyramzi/vibe-kit/commit/ac0f4ce5))


## [1.16.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.15.0...ui-v1.16.0) (2026-06-12)

_Released as 0.24.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** add gauge, ring, and legend charts and theme the layerchart tooltip ([d3d9135](https://github.com/heyramzi/vibe-kit/commit/d3d91350))
* **ui:** add AnimatedBeam, Spotlight, Marquee, and ImageReveal effects ([97fbb4e](https://github.com/heyramzi/vibe-kit/commit/97fbb4e1))
* **ui:** add package descriptions to the workspace manifests ([2e6630b](https://github.com/heyramzi/vibe-kit/commit/2e6630be))


### Bug Fixes

* **ui:** Marquee honors --duration/--gap class overrides ([2026671](https://github.com/heyramzi/vibe-kit/commit/20266715))


## [1.15.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.14.6...ui-v1.15.0) (2026-06-01)

_Released as 0.23.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** add ai subpath with chat primitives ([9683760](https://github.com/heyramzi/vibe-kit/commit/96837605e10590a1a416aa7c55429b5cd7b9a2b3))
* **ui:** add charts subpath with layerchart wrappers ([f90de43](https://github.com/heyramzi/vibe-kit/commit/f90de43f8fb6271847fcc13d6d03a8c267fd2c24))
* **ui:** add shadcn-svelte primitives under @heyramzi/ui/shadcn/* ([4ea5ad0](https://github.com/heyramzi/vibe-kit/commit/4ea5ad0635dd12aa1714b6a59108d09c7e24de43))
* **ui:** add ThemeToggle with view-transition reveal ([b212e40](https://github.com/heyramzi/vibe-kit/commit/b212e40e4e47f09b8b12d5d0cd507f24d926c7a5))
* **ui:** BorderBeam bloom + offscreen-pause props, reduced-motion respect ([de4de48](https://github.com/heyramzi/vibe-kit/commit/de4de4819e9bc81b8fcf058dd921068ede8ee834))
* **ui:** commit forms primitives + bump to 0.7.0 ([bfde6e8](https://github.com/heyramzi/vibe-kit/commit/bfde6e8b8d6a016970ab6efe72d16af88276074e))
* **ui:** rewrite charts with primitive composition + add transitions.dev animations ([959f2f6](https://github.com/heyramzi/vibe-kit/commit/959f2f6906a551d096d64bd5e728ae56fa831f51))
* **ui:** sheet animation, dropdown delayed-open, dialog/alert refinements ([b0bc699](https://github.com/heyramzi/vibe-kit/commit/b0bc69918ded03d44040c8ec8254a756a2f011d9))
* **ui:** thread BorderBeam colors prop through gradient helpers (0.14.0) ([7235d34](https://github.com/heyramzi/vibe-kit/commit/7235d34225cc619ba3dee025281aa63e87640f1d))


### Bug Fixes

* **ui:** add style condition to ./animations export for rolldown CSS resolution ([b759478](https://github.com/heyramzi/vibe-kit/commit/b75947847bdf07c3c87b7298cdabc6aabe3d3097))
* **ui:** align icon-swap demo markup with package CSS contract; pick up bar/area chart polish ([edefa61](https://github.com/heyramzi/vibe-kit/commit/edefa619e7681744868cd40c83eb1d68c2167ba5))
* **ui:** anchor FaceIcon thinking gradient at top and dissolve cone edge ([6ef356d](https://github.com/heyramzi/vibe-kit/commit/6ef356dec207ceb30b06881d78a002d5d9a42766))
* **ui:** blur thinking-state brain overlay so gradient feels softer ([362285f](https://github.com/heyramzi/vibe-kit/commit/362285f4ffc7aaeda98610c87f47960d37fe2f1f))
* **ui:** drop isolation+contain from BorderBeam host (0.14.1) ([cb67c2f](https://github.com/heyramzi/vibe-kit/commit/cb67c2fda6f675e30c19d5a5d5cfa55e9a271539))
* **ui:** drop unused colors arg from BorderBeam gradient helpers ([b89318f](https://github.com/heyramzi/vibe-kit/commit/b89318f0606f287602ffb4c9117cd4dd385f2ab7))
* **ui:** exact replica CSS for transitions.dev animations + port their dark/light demo theming ([32a42d8](https://github.com/heyramzi/vibe-kit/commit/32a42d8495c3cdc17d450751a43031eb928fd7f8))
* **ui:** import superForm from /client in use-form helper ([5cd3917](https://github.com/heyramzi/vibe-kit/commit/5cd391774d639c1a7a5df45bf0b27911d07009b1))
* **ui:** import superValidate from /server in form helpers ([8428fcd](https://github.com/heyramzi/vibe-kit/commit/8428fcdf741921cf9ee71a3d5978d579ca71be43))
* **ui:** inline Writable type in use-field-value to avoid import-type parse error in Rolldown optimizer; bump 0.7.1 ([73038a0](https://github.com/heyramzi/vibe-kit/commit/73038a0ef33a765e23f02b4d701893b211e2879d))
* **ui:** narrow vaul-svelte peer to &gt;=1.0.0-next.7 only ([c88707b](https://github.com/heyramzi/vibe-kit/commit/c88707b14305dd43afa731a32a7ac3a0c4ae3860))
* **ui:** register BorderBeam [@property](https://github.com/property) values via CSS.registerProperty (0.14.2) ([95212c6](https://github.com/heyramzi/vibe-kit/commit/95212c6c762a51b09200105df80e7a3d1d090b0a))
* **ui:** relax vaul-svelte peer to accept stable 0.3.x or pre-release 1.0+ (0.15.2) ([0f3bd4c](https://github.com/heyramzi/vibe-kit/commit/0f3bd4c6d342557eb55e4b7dc5f501ea5d40341f))
* **ui:** rename Confirmation `state` prop to `kind` ([9e126dc](https://github.com/heyramzi/vibe-kit/commit/9e126dcea7bc5d41838343f59fb9dc427cc6206e))
* **ui:** replace template-expression state mutations with FieldSync component ([975d41e](https://github.com/heyramzi/vibe-kit/commit/975d41e4fe80f48bca355f001c868242fb3004d5))
* **ui:** set form context synchronously, not in $effect ([ba6ccb3](https://github.com/heyramzi/vibe-kit/commit/ba6ccb313b9276216fccd8bfa493d33cdbedaaf3))
* **ui:** untrack fieldCtx writes in form-field snippets ([94cf361](https://github.com/heyramzi/vibe-kit/commit/94cf3614c6f9d2465fd34bc18d9dee6b32dc33ed))
* **ui:** widen vaul-svelte peer to allow 1.0.0-next.7 ([776396d](https://github.com/heyramzi/vibe-kit/commit/776396dbdb1037b1ca406c29886ceee552f59212))
* **ui:** wrap form-field Label inside Control for formsnap v2 compat ([4444d7c](https://github.com/heyramzi/vibe-kit/commit/4444d7cdf7dfb7069f54632a68b491a65187249a))
* **workspace:** use workspace: protocol for cross-package peer deps ([cba21a1](https://github.com/heyramzi/vibe-kit/commit/cba21a1673444b3c0f7e3bf8d9cfebe6c0a11564))

## [1.8.1](https://github.com/heyramzi/vibe-kit/compare/ui-v1.8.0...ui-v1.8.1) (2026-05-09)

_Released as 0.15.1 before the 19 Oct 2026 renumbering._


### Bug Fixes

* **ui:** register BorderBeam [@property](https://github.com/property) values via CSS.registerProperty (0.14.2) ([95212c6](https://github.com/heyramzi/vibe-kit/commit/95212c6c762a51b09200105df80e7a3d1d090b0a))

## [1.8.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.6.2...ui-v1.8.0) (2026-05-09)

_Released as 0.15.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** add charts subpath with layerchart wrappers ([f90de43](https://github.com/heyramzi/vibe-kit/commit/f90de43f8fb6271847fcc13d6d03a8c267fd2c24))
* **ui:** add shadcn-svelte primitives under @heyramzi/ui/shadcn/* ([4ea5ad0](https://github.com/heyramzi/vibe-kit/commit/4ea5ad0635dd12aa1714b6a59108d09c7e24de43))
* **ui:** BorderBeam bloom + offscreen-pause props, reduced-motion respect ([de4de48](https://github.com/heyramzi/vibe-kit/commit/de4de4819e9bc81b8fcf058dd921068ede8ee834))
* **ui:** commit forms primitives + bump to 0.7.0 ([bfde6e8](https://github.com/heyramzi/vibe-kit/commit/bfde6e8b8d6a016970ab6efe72d16af88276074e))
* **ui:** rewrite charts with primitive composition + add transitions.dev animations ([959f2f6](https://github.com/heyramzi/vibe-kit/commit/959f2f6906a551d096d64bd5e728ae56fa831f51))
* **ui:** sheet animation, dropdown delayed-open, dialog/alert refinements ([b0bc699](https://github.com/heyramzi/vibe-kit/commit/b0bc69918ded03d44040c8ec8254a756a2f011d9))
* **ui:** thread BorderBeam colors prop through gradient helpers (0.14.0) ([7235d34](https://github.com/heyramzi/vibe-kit/commit/7235d34225cc619ba3dee025281aa63e87640f1d))


### Bug Fixes

* **ui:** add style condition to ./animations export for rolldown CSS resolution ([b759478](https://github.com/heyramzi/vibe-kit/commit/b75947847bdf07c3c87b7298cdabc6aabe3d3097))
* **ui:** align icon-swap demo markup with package CSS contract; pick up bar/area chart polish ([edefa61](https://github.com/heyramzi/vibe-kit/commit/edefa619e7681744868cd40c83eb1d68c2167ba5))
* **ui:** drop isolation+contain from BorderBeam host (0.14.1) ([cb67c2f](https://github.com/heyramzi/vibe-kit/commit/cb67c2fda6f675e30c19d5a5d5cfa55e9a271539))
* **ui:** drop unused colors arg from BorderBeam gradient helpers ([b89318f](https://github.com/heyramzi/vibe-kit/commit/b89318f0606f287602ffb4c9117cd4dd385f2ab7))
* **ui:** exact replica CSS for transitions.dev animations + port their dark/light demo theming ([32a42d8](https://github.com/heyramzi/vibe-kit/commit/32a42d8495c3cdc17d450751a43031eb928fd7f8))
* **ui:** import superForm from /client in use-form helper ([5cd3917](https://github.com/heyramzi/vibe-kit/commit/5cd391774d639c1a7a5df45bf0b27911d07009b1))
* **ui:** import superValidate from /server in form helpers ([8428fcd](https://github.com/heyramzi/vibe-kit/commit/8428fcdf741921cf9ee71a3d5978d579ca71be43))
* **ui:** inline Writable type in use-field-value to avoid import-type parse error in Rolldown optimizer; bump 0.7.1 ([73038a0](https://github.com/heyramzi/vibe-kit/commit/73038a0ef33a765e23f02b4d701893b211e2879d))
* **ui:** set form context synchronously, not in $effect ([ba6ccb3](https://github.com/heyramzi/vibe-kit/commit/ba6ccb313b9276216fccd8bfa493d33cdbedaaf3))
* **ui:** widen vaul-svelte peer to allow 1.0.0-next.7 ([776396d](https://github.com/heyramzi/vibe-kit/commit/776396dbdb1037b1ca406c29886ceee552f59212))
* **workspace:** use workspace: protocol for cross-package peer deps ([cba21a1](https://github.com/heyramzi/vibe-kit/commit/cba21a1673444b3c0f7e3bf8d9cfebe6c0a11564))

## [1.6.2](https://github.com/heyramzi/vibe-kit/compare/ui-v1.6.1...ui-v1.6.2) (2026-05-09)

_Released as 0.13.2 before the 19 Oct 2026 renumbering._


### Bug Fixes

* **ui:** drop unused colors arg from BorderBeam gradient helpers ([b89318f](https://github.com/heyramzi/vibe-kit/commit/b89318f0606f287602ffb4c9117cd4dd385f2ab7))

## [1.6.1](https://github.com/heyramzi/vibe-kit/compare/ui-v1.6.0...ui-v1.6.1) (2026-05-09)

_Released as 0.13.1 before the 19 Oct 2026 renumbering._


### Bug Fixes

* **ui:** widen vaul-svelte peer to allow 1.0.0-next.7 ([776396d](https://github.com/heyramzi/vibe-kit/commit/776396dbdb1037b1ca406c29886ceee552f59212))

## [1.6.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.1.0...ui-v1.6.0) (2026-05-08)

_Released as 0.13.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** add charts subpath with layerchart wrappers ([f90de43](https://github.com/heyramzi/vibe-kit/commit/f90de43f8fb6271847fcc13d6d03a8c267fd2c24))
* **ui:** add shadcn-svelte primitives under @heyramzi/ui/shadcn/* ([4ea5ad0](https://github.com/heyramzi/vibe-kit/commit/4ea5ad0635dd12aa1714b6a59108d09c7e24de43))
* **ui:** BorderBeam bloom + offscreen-pause props, reduced-motion respect ([de4de48](https://github.com/heyramzi/vibe-kit/commit/de4de4819e9bc81b8fcf058dd921068ede8ee834))
* **ui:** commit forms primitives + bump to 0.7.0 ([bfde6e8](https://github.com/heyramzi/vibe-kit/commit/bfde6e8b8d6a016970ab6efe72d16af88276074e))
* **ui:** rewrite charts with primitive composition + add transitions.dev animations ([959f2f6](https://github.com/heyramzi/vibe-kit/commit/959f2f6906a551d096d64bd5e728ae56fa831f51))
* **ui:** sheet animation, dropdown delayed-open, dialog/alert refinements ([b0bc699](https://github.com/heyramzi/vibe-kit/commit/b0bc69918ded03d44040c8ec8254a756a2f011d9))


### Bug Fixes

* **ui:** add style condition to ./animations export for rolldown CSS resolution ([b759478](https://github.com/heyramzi/vibe-kit/commit/b75947847bdf07c3c87b7298cdabc6aabe3d3097))
* **ui:** align icon-swap demo markup with package CSS contract; pick up bar/area chart polish ([edefa61](https://github.com/heyramzi/vibe-kit/commit/edefa619e7681744868cd40c83eb1d68c2167ba5))
* **ui:** exact replica CSS for transitions.dev animations + port their dark/light demo theming ([32a42d8](https://github.com/heyramzi/vibe-kit/commit/32a42d8495c3cdc17d450751a43031eb928fd7f8))
* **ui:** import superForm from /client in use-form helper ([5cd3917](https://github.com/heyramzi/vibe-kit/commit/5cd391774d639c1a7a5df45bf0b27911d07009b1))
* **ui:** import superValidate from /server in form helpers ([8428fcd](https://github.com/heyramzi/vibe-kit/commit/8428fcdf741921cf9ee71a3d5978d579ca71be43))
* **ui:** inline Writable type in use-field-value to avoid import-type parse error in Rolldown optimizer; bump 0.7.1 ([73038a0](https://github.com/heyramzi/vibe-kit/commit/73038a0ef33a765e23f02b4d701893b211e2879d))
* **ui:** set form context synchronously, not in $effect ([ba6ccb3](https://github.com/heyramzi/vibe-kit/commit/ba6ccb313b9276216fccd8bfa493d33cdbedaaf3))
* **workspace:** use workspace: protocol for cross-package peer deps ([cba21a1](https://github.com/heyramzi/vibe-kit/commit/cba21a1673444b3c0f7e3bf8d9cfebe6c0a11564))

## [1.1.0](https://github.com/heyramzi/vibe-kit/releases/tag/ui-v1.1.0) (2026-05-03)

_Released as 0.5.0 before the 19 Oct 2026 renumbering._


### Features

* **ui:** add charts subpath with layerchart wrappers ([f90de43](https://github.com/heyramzi/vibe-kit/commit/f90de43f8fb6271847fcc13d6d03a8c267fd2c24))
* **ui:** add shadcn-svelte primitives under @heyramzi/ui/shadcn/* ([4ea5ad0](https://github.com/heyramzi/vibe-kit/commit/4ea5ad0635dd12aa1714b6a59108d09c7e24de43))


### Bug Fixes

* **ui:** add style condition to ./animations export for rolldown CSS resolution ([b759478](https://github.com/heyramzi/vibe-kit/commit/b75947847bdf07c3c87b7298cdabc6aabe3d3097))

## [1.46.0](https://github.com/heyramzi/vibe-kit/compare/ui-v1.45.0...ui-v1.46.0) (2026-10-06)

_Released as 4.6.0 before the 19 Oct 2026 renumbering._

### Features

* feat: move vibe-kit UI packages here, hub home page, private repo with password
* feat: initial Svelte 5 library: ui, kanban, status, agents, slides


## 1.47.0 (2026-10-07)

_Released as 4.7.0 before the 19 Oct 2026 renumbering._

### Features

* feat(review): agent dock, layout library, pace pill and a pill radius token

### Bug Fixes

* fix(ui): stat card header overlap and the showcase nav trapping the wheel


## 1.47.1 (2026-10-07)

_Released as 4.7.1 before the 19 Oct 2026 renumbering._

### Bug Fixes

* fix(ui): keep server form helpers out of the client forms barrel


## 1.48.0 (2026-10-09)

_Released as 5.0.0 before the 19 Oct 2026 renumbering._

### Breaking Changes

* `src/components`, 16 shadcn modules and 17 ai modules no product imported are deleted, along with forms and ports (upsys owns those now).
* `chat` is merged into `ai`: import Composer and the chat parts from `@heyramzi/ui/ai`.
* Only singletons stay peers; dep and peer ranges are realigned.

### Features

* feat(ui): one revealTheme helper, a 3-mode ThemeToggle and a bottom Sheet

### Bug Fixes

* fix(ui): strip control bytes before the Response link check and render images as links


## 1.48.1 (2026-10-09)

_Released as 5.0.1 before the 19 Oct 2026 renumbering._

### Bug Fixes

* fix(ui,marketing): accept any @heyramzi/utils 1.x from 1.3.3


## 1.48.2 (2026-10-14)

_Released as 5.0.2 before the 19 Oct 2026 renumbering._

### Bug Fixes

* fix(ui): small controls keep a 32px hit area (44px on touch) without growing
* fix(ui): type errors in reasoning, conversation, charts and image-reveal; site check skips build/


## 1.49.0 (2026-10-14)

_Released as 6.0.0 before the 19 Oct 2026 renumbering._

### Features

* feat(ui)!: retire --ease-bounce and --ease-bounce-strong


## [1.49.1](https://github.com/heyramzi/ui/releases/tag/ui-v1.49.1) (2026-10-14)

_Released as 6.0.1 before the 19 Oct 2026 renumbering._

### Bug Fixes

* fix(ui): the last overshoot curves settle on --ease-smooth-out


## [1.50.0](https://github.com/heyramzi/ui/compare/ui-v1.49.1...ui-v1.50.0) (2026-10-16)

_Released as 6.1.0 before the 19 Oct 2026 renumbering._

### Features

* feat(ui): agents move into @heyramzi/ui/agents, draw is retired, marketing gets a site page


## [1.51.0](https://github.com/heyramzi/ui/compare/ui-v1.50.0...ui-v1.51.0) (2026-10-16)

_Released as 7.0.0 before the 19 Oct 2026 renumbering._

### Features

* feat(ui)!: shadcn CodeBlock, Trace and MessageScroller, and MessageScroller replaces ai/conversation
* feat(ui): a shadcn Kbd and KbdGroup, and revealTheme takes an easing
* feat(ui): tabs slide one shared pill, and the unused 1024px is-mobile copy goes
* feat(charts)!: the charts move out of @heyramzi/ui into @heyramzi/charts


## [1.52.0](https://github.com/heyramzi/ui/compare/ui-v1.51.0...ui-v1.52.0) (2026-10-16)

_Released as 8.0.0 before the 19 Oct 2026 renumbering._

### Features

* feat(ui): a components folder with picker, segmented, mark and icon, computeCommandScore export and lib subpath exports

### Bug Fixes

* fix(ui): Reasoning and ToggleGroup pass live props to their context, so svelte-check stops warning in linking apps
* fix(ui): svelte-check in a linking app reads the sources without the vite config


## [1.53.0](https://github.com/heyramzi/ui/compare/ui-v1.52.0...ui-v1.53.0) (2026-10-19)

_Released as 8.1.0 before the 19 Oct 2026 renumbering._

### Features

* feat(ui): AgentCast wakes the card under the pointer and names each agent once

### Bug Fixes

* fix(ui): AgentCast's hover border is gated to a fine pointer, so it doesn't stick after a tap
* fix(ui): agent avatars fade in once measured, pick their own ink, and repaint after the gate


## [1.54.0](https://github.com/heyramzi/ui/compare/ui-v1.53.1...ui-v1.54.0) (2026-10-21)

### Features

* feat(ui): field-row, section-card, section-header, table-view, docs and theme components; contrast fixes; Progress tone; Button text variant

### Bug Fixes

* fix(ui): raw :hover in the token primitives only fires where a pointer hovers


## [1.54.1](https://github.com/heyramzi/ui/compare/ui-v1.54.0...ui-v1.54.1) (2026-10-21)

### Bug Fixes

* fix(ui): FieldRow matches a touch-sized Button with a 44px input on a coarse pointer


## [1.54.2](https://github.com/heyramzi/ui/compare/ui-v1.54.1...ui-v1.54.2) (2026-10-21)

### Bug Fixes

* fix(ui): ThemeToggle names the properties it animates and grows its icon from 90%
* fix(ui): install without the private @heyramzi/utils


## [2.0.0](https://github.com/heyramzi/ui/compare/ui-v1.54.2...ui-v2.0.0) (2026-10-21)

### Features

* feat(ui): tasks, charts, slides, editor, onboarding and canvas become subpaths of ui

### Bug Fixes

* fix(ui): raw :hover in canvas, gantt and Segmented only fires where a pointer hovers


## [2.0.1](https://github.com/heyramzi/ui/compare/ui-v2.0.0...ui-v2.0.1) (2026-10-22)

### Bug Fixes

* fix(ui): stop the rich editor rebuilding in a loop when an app feeds its output back as content


## [2.1.0](https://github.com/heyramzi/ui/compare/ui-v2.0.1...ui-v2.1.0) (2026-10-22)

### Features

* feat(ui): status, panel, record, thread and threaded inbox subpaths


## [2.2.0](https://github.com/heyramzi/ui/compare/ui-v2.1.0...ui-v2.2.0) (2026-10-22)

### Features

* feat(ui): one inbox, built on the list-page kit

### Bug Fixes

* fix(ui): gate raw hover styles behind the hover media query


## [2.3.0](https://github.com/heyramzi/ui/compare/ui-v2.2.0...ui-v2.3.0) (2026-10-22)

### Features

* feat(ui): TableView takes sortable heads, row links, selection, row menus, groups, sub-rows and loading rows


## [2.4.0](https://github.com/heyramzi/ui/compare/ui-v2.3.0...ui-v2.4.0) (2026-10-23)

### Features

* feat(ui): TableView takes onRowLink for in-place row links, and a null group key draws no header


## [2.5.0](https://github.com/heyramzi/ui/compare/ui-v2.4.0...ui-v2.5.0) (2026-10-23)

### Features

* feat(ui): AreaChart takes a resting headline, like a period total, shown until a point is hovered


## [2.6.0](https://github.com/heyramzi/ui/compare/ui-v2.5.0...ui-v2.6.0) (2026-10-23)

### Features

* feat(ui): InfoList takes layout="row", a read-only band of items with term, content and action snippets


## [2.7.0](https://github.com/heyramzi/ui/compare/ui-v2.6.0...ui-v2.7.0) (2026-10-23)

### Features

* feat(ui): brand settings take primary colors for the key button, light and dark


## [2.8.0](https://github.com/heyramzi/ui/compare/ui-v2.7.0...ui-v2.8.0) (2026-10-23)

### Features

* feat(ui)!: keep UI motion under 300ms; very-slow splits into overlay and loop


## [2.9.0](https://github.com/heyramzi/ui/compare/ui-v2.8.0...ui-v2.9.0) (2026-10-23)

### Features

* feat(thread): events between comments, long bodies fold, and the inbox draws its thread through it
* feat(ui): rename the tasks subpaths to work

### Bug Fixes

* fix(ui): hover styles only on hover devices, unitless line heights, and default dates take a locale


## [2.10.0](https://github.com/heyramzi/ui/compare/ui-v2.9.0...ui-v2.10.0) (2026-10-26)

### Features

* feat(ui): ship a built dist so plain Node can load the TypeScript entries

### Bug Fixes

* fix(ui): toolbar triggers get the outline button's edge and a card fill
* fix(ui): point the record demo data's links at the page
* fix(ui): point the record demo's breadcrumbs at the page

