# Design rules for @heyramzi/ui

These rules decide how every component in this package looks and moves. They come from the
people whose work we copy, read at the source: Emil Kowalski, Jakub Antalik, Jakub Krehel,
Rauno Freiberg and the Vercel guidelines, Linear, Paco Coursey's cmdk and shadcn. Each rule
names where it comes from, so you can check the reasoning before you break it.

The package is moving to four layers. Each layer may do some things and never others. A
layer only styles through the layer below it, so one token edit moves every screen.

| Layer | Lives in | Owns |
| --- | --- | --- |
| Tokens | `src/tokens` (`palette.css`, `craft.css`, `base.css`), `src/design`, `src/animations` | every colour, radius, shadow, duration and easing |
| Atoms | `src/shadcn` | one control: button, input, menu, dialog, tooltip, sheet |
| Molecules | `src/components`, `src/status` | small patterns: chip, pill, property row, card, segmented, table |
| Organisms | `src/work`, `src/inbox`, `src/thread`, `src/record`, `src/panel` | whole surfaces: kanban, task list, gantt, detail, inbox, thread, record, side panel |

The board with the evidence, quotes and session log is
`~/Studio/upsys/playground/2026-10-23-design-language-principles.html`.

## Tokens

A token says what a value is for, never what size it is. Read the current values in
`src/tokens/craft.css`; this file names roles so it stays true when a value moves.

**May:** define colour, radius, elevation, focus and motion values, and their dark versions.
**May not:** be skipped. No raw hex, px radius, `box-shadow` or millisecond value in a layer
above, and no `transition: all`.

1. **Colour comes from 3 inputs, and the accent stays rare.** Linear builds every theme from a
   base colour, an accent and a contrast value in LCH, down from 98 variables, and cut how
   much blue chrome the maths lets in
   ([How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui)).
   Our palette is OKLCH in `palette.css`. The accent marks focus, selection and the one
   primary action on a screen. It's never decoration. An input's edge holds 3:1 against the
   surfaces it sits on: dark `--color-input` is paper mixed 45% into the card colour, L 0.547,
   3.7:1 on the card and 4.0:1 on the canvas.
2. **Radius by role.** `--radius-sm` chip and badge, `--radius-lg` control, `--radius-xl` card
   and panel, `--radius-2xl` overlay, `--radius-3xl` the shell panel. A component picks the
   role, never a number.
3. **Depth is a shadow, structure is a border.** Cards, buttons and overlays get their edge
   and depth from the `--elev-*` steps. A border is for a divider, an input, or a selected or
   focused state. Krehel: "Shadows for Elevation, Borders for Structure"
   ([make-interfaces-feel-better](https://github.com/jakubkrehel/make-interfaces-feel-better/blob/main/skills/make-interfaces-feel-better/SKILL.md)).
   Vercel: "Layered shadows. Mimic ambient + direct light with at least two layers"
   ([web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines)).
4. **Motion is named.** Durations, easings, distances, scales and blur are the
   `--duration-*`, `--ease-*`, `--distance-*`, `--scale-*` and `--blur-*` tokens. Every open
   is longer than its close, and no curve overshoots: no `cubic-bezier` y value above 1.
   transitions.dev: "Every piece reads from the same scale of motion tokens"
   ([transitions.dev](https://transitions.dev/detail.html?doc=introduction)).
5. **UI motion stays under 300ms**, on an ease-out curve. Only an overlay, a drawer or a
   marketing explainer reaches `--duration-overlay`. Emil: "UI animations should generally
   stay under 300ms", and "Never use ease-in for UI animations"
   ([You don't need animations](https://emilkowal.ski/ui/you-dont-need-animations),
   [emil-design-eng](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md)).

## Atoms: `src/shadcn`

An atom is one control and owns its states: rest, hover, focus, active, disabled, loading.

**May:** read tokens, set its own role radius, own its open and close motion through a `t-*`
class, and expose a variant.
**May not:** hold a raw value, know which screen it sits on, or animate something the user
triggers from the keyboard many times a day.

6. **Keyboard and high-frequency actions never animate.** The command palette opens and closes
   instantly; only its list height moves, at about 100ms, the way cmdk does with
   `--cmdk-list-height` ([cmdk](https://github.com/pacocoursey/cmdk)). Emil, on keyboard
   actions: "You should never animate them." Rauno: "I removed motion from core interactions
   and suddenly felt like I was moving much faster"
   ([Invisible details of interaction design](https://rauno.me/craft/interaction-design)).
   So `CommandDialog` doesn't ride `t-modal`.
7. **Opens fast, closes faster.** Menus open on `--duration-fast` and close on
   `--duration-quick`, both on `--ease-smooth-out`. Emil's ranges: tooltips 125 to 200ms,
   dropdowns 150 to 250ms.
8. **Tooltips wait once, then don't.** The first tooltip in a group waits (`delayDuration`
   400ms); its neighbours open with no delay and no animation, so `instant-open` gets no
   transition. Emil: "hovering over adjacent tooltips should open them instantly with no
   animation." Vercel: "Delay the first tooltip in a group; subsequent peers have no delay."
9. **Grow from the trigger, never from nothing.** A menu or popover scales from
   `--scale-medium` with its origin at the trigger (`data-side` and `data-align` set it). A
   modal scales from `--scale-large` at the centre. Never `scale(0)`. Emil: "Nothing in the
   real world appears from nothing", "Start from scale(0.9) or higher." Vercel: "Correct
   transform origin."
10. **Use transitions for anything the user can re-trigger.** A transition retargets mid-way;
    a keyframe restarts from zero. Keyframes are for one-shot sequences like the success
    check. Emil: "I initially used CSS keyframes for the animations, but they aren't
    interruptible" ([Building a toast component](https://emilkowal.ski/ui/building-a-toast-component)).
    Krehel says the same in his principle 4.
11. **Drawers and toasts follow Vaul and Sonner.** A drawer moves for 0.5s on
    `cubic-bezier(0.32, 0.72, 0, 1)` ([Vaul constants](https://github.com/emilkowalski/vaul/blob/main/src/constants.ts)).
    A swipe dismisses on a flick, not only a distance: Sonner dismisses past 45px or above a
    velocity of 0.11 px/ms, keeps 3 toasts visible 14px apart, lives 4 seconds and pauses on
    hover and on a hidden tab ([Sonner](https://github.com/emilkowalski/sonner/blob/main/src/index.tsx)).
    Our toast is `shadcn/sonner`, which carries those values.
12. **Every pressable answers, and states raise contrast.** Each button gets `.t-press`; hover,
    active and focus each read stronger than rest, and focus is `--ring-focus` on
    `:focus-visible`. Vercel: "Interactions increase contrast." Hit area: at least 24px, 44px
    on touch, with icon buttons 32px on desktop (Vercel's floors; Krehel asks for 40px, which
    our dense rows can't take).
13. **Every transition ships its reduced-motion version**, keeping opacity and colour and
    dropping movement. Vercel: "Honor prefers-reduced-motion." transitions.dev: "State is
    always reflected in the DOM and text, never conveyed only through movement."

## Molecules: `src/components`, `src/status`

A molecule is the one place a small pattern gets its look: a chip, a pill, a property row, a
card, a segmented control, a table.

**May:** compose atoms, set the role radius and elevation for its pattern, and define the
shapes an organism reuses.
**May not:** introduce a token, use a raw value, or give two components two looks for the
same pattern.

14. **Outer radius equals inner radius plus padding.** A card with 4px padding around a
    `--radius-lg` control takes the next step up, never the same radius. Krehel: "Outer
    radius = inner radius + padding" ([Details that make interfaces feel better](https://jakub.kr/writing/details-that-make-interfaces-feel-better)).
    Vercel: "Child radius ≤ parent radius & concentric so curves align."
15. **A pill means status or a count.** `rounded-full` is for `StatusBadge`, a count and an
    avatar. Buttons are role-radius rectangles. This one is our own call (the `anti-ai-slop`
    skill bans pill buttons), not a quote from the sources.
16. **Numbers that change or get compared are tabular.** Counters, table columns, stats and
    timers use `tabular-nums`. Krehel: "Use font-variant-numeric: tabular-nums for any
    dynamically updating numbers to prevent layout shift." Headings wrap with
    `text-wrap: balance`, paragraphs with `pretty`.
17. **Icons stay quieter than text.** Phosphor at 16px, `regular` beside regular text and
    `bold` beside semibold, recoloured through `currentColor`, filled only for the active
    state. Linear's refresh "reduces icon usage, scales their sizes down, and removes
    unnecessary visual treatments like colored team icon backgrounds"
    ([Behind the latest design refresh](https://linear.app/now/behind-the-latest-design-refresh)).
    Krehel matches stroke to text weight.

## Organisms: `src/work`, `src/inbox`, `src/thread`, `src/record`, `src/panel`

An organism is a whole surface. It decides layout and what goes where, never how a piece
looks.

**May:** lay out molecules and atoms, choose density, decide what is primary on the surface.
**May not:** set its own radius, border, shadow, pill or colour. A task chip, a property row
or a status pill in `src/work` comes from a molecule. If it needs a look nobody has, add the
molecule first. Today the organism folders hold about 48 bare `border` classes and 27
`rounded-full`; each one is a molecule waiting to be extracted.

18. **Navigation recedes, the work stays in focus.** The sidebar sits on the grey canvas a
    step dimmer; only the inset panel holding the work is white. Linear: "While the parts
    central to the user's task should stay in focus, ones that support orientation and
    navigation should recede", and "Don't compete for attention you haven't earned."
19. **Keep the density, lose the noise.** Rows are 32px on desktop and 44px on touch, a list
    is rows and not a card per row, and structure comes from spacing and soft separators.
    Linear: "preserving that rich density of information without letting the interface feel
    overwhelming", and "Structure should be felt not seen." (The 32px figure is our command
    item height, not a number Linear published.)
20. **Loading never flickers, success never waits.** A skeleton shows after about 150ms and
    stays at least 300ms, so a fast answer doesn't blink. A likely success updates the row
    at once and rolls back with an error on failure. Vercel: "add a short show-delay (~150 to
    300 ms) & a minimum visible time (~300 to 500 ms)", and "Optimistic updates."
21. **The kanban, the task list and the gantt drag by the same rules as a drawer.** Drag
    follows the pointer with no transition while it moves, captures the pointer, and settles
    with a transition when released. Emil's Sonner sets `transition: none` while swiping
    and hands back to the transition on release.

## Patterns

Rules 1 to 21 say what each layer may do. This section says how each repeating pattern looks,
once, so no screen decides it again. Each rule names its default, the one exception if there
is one, the component that carries it, and the `lint:ui` rule that fails a hand-drawn copy
(`check-ui-consistency.mjs` in agency-os). A caller never adds classes to get the default;
an exception is a named prop. Popups are in the atoms above, and hover, press and focus in
rule 12.

- **Tables.** A table never draws its own frame; the surface under it is the frame. As a
  page's main content it sits flat on the white panel: a muted header band
  (`bg-foreground/3`), hairline row dividers, no ring, border or shadow. On a page of several
  parts it sits in a `SectionCard flush`, and the card frames it. No exception. Carried by
  `TableView`; `bare` is a no-op kept for old callers. Lint: `table-frame`.
- **List rows.** A list is rows, never a card per row (rule 19). One line is 32px, 44px on
  touch. A two-line row holds a name over one muted meta line (`text-xs`), and the meta
  line never repeats a column. Carried by `TableView` and `GroupedList`; `RailRow` is the
  exception, for a master and detail rail.
- **Logo and avatar tiles in a row.** One tile per row, 24px in a list and 40px in a header,
  `--radius-md` square for a company and round for a person. A logo gets a 1px neutral
  outline, never a themed border. No logo: the industry icon when the industry is known, else
  the name's initial on `bg-foreground/5`. Never the same grey building icon on every row.
  Carried by the app's `ClientLogo`, and `Avatar` for people.
- **Page header and toolbar.** Every page opens with its title, large and tight, at the top
  of the panel (the approved W1 tile, refs 03, 05 and 07). Under it, one toolbar row: search
  at the start, filters beside it, view chips and the view switch at the end, then the single
  primary action last. Carried by `ListPageShell` (`search`, `filters`, `tabs`,
  `rightActions`) and `Toolbar`. A detail page's title comes from `DetailHeader`.
- **Filter and view chips.** Mutually exclusive views are one `Segmented` track; a filter is a
  `FilterPopover` trigger, never a row of toggle buttons. A count sits inside the segment, in
  `tabular-nums`, muted, with no pill behind it. Carried by `Segment` (`count`).
- **Counts beside tabs and headings.** A bare muted number after the label, `tabular-nums`,
  no brackets and no pill. A pill is only for a count that needs the user (unread, overdue).
  Carried by `Segment` and `SectionHeader`.
- **Section headers and section cards.** A section on a page of parts is a `SectionCard`:
  fixed-height header, `h3` title, a line under it, `actions` on the right. A section inside a
  card or a sheet is a `SectionHeader`, with no card. Lint: `section-card`, `card-title`,
  `card-separator`.
- **Cards in grids.** Cards go in a grid only when each one is a thing you open (a template, a
  diagram, an asset), with `--elev-card` and no border (rule 3). Facts about one record are an
  `InfoList`, never a grid of cards. Lint: `side-by-side-panels`, `hand-dl`.
- **Stat tiles.** A row of 2 to 4 `StatCard`s at the top of a dashboard, the figure in
  `tabular-nums` and its label above it. A single figure goes in the section header, not a
  tile. Carried by `StatCard` from `@heyramzi/ui/charts`.
- **Empty states.** `EmptyState`: one icon, one line that says what to do next, one action.
  An empty table renders it through `TableView`'s `empty`. Lint: `dashed-box`, `bare-loading`.
- **Labels and eyebrows.** A label over a group, a column, a panel or a figure is sentence
  case, muted, at normal tracking: "Lines", "Task time", "4 quotes". Never `uppercase` with
  `tracking-*`; all-caps tracked eyebrows are the AI house style (`anti-ai-slop`). The one
  exception is a keyboard key or code (`kbd`, `code`), which keeps its own case. Carried by
  `SectionLabel`. Lint: `caps-label`.
- **Status pills and tag chips.** A status is a `StatusBadge`: tinted, an icon, rounded-full
  (rule 15). A registry status always shows its icon, the map's own or its variant's shape. A tag or category is a `TagChip`: a dot and an outline, `--radius-sm`. Never a
  hand-drawn pill. Lint: `hand-pill`.
- **Sort in column heads.** A sortable head shows `CaretUpDown` muted at rest and one bold
  caret when sorted; a head that can't sort shows nothing. Carried by `TableView` (`sortable`).
  No hand-built sort buttons.
- **Row actions.** One overflow menu at the row's end, shown at rest on touch and on hover or
  keyboard focus with a pointer. The same items open on right-click (`rowMenu`). A row's single
  most used action can sit at rest beside it. The reveal is two classes from `craft.css`:
  `hover-row` on the row (a chip, tile or card works the same) and `row-action` on each action
  or their wrapper. It fades on `--duration-quick`, stays up while its menu is open, and never
  hides on a touch screen (`any-pointer: coarse` or `hover: none`). Never hand-roll
  `opacity-0 group-hover:opacity-100`; a finger can't hover, so that action is gone on a phone.
  The exceptions: a decorative hint that isn't a control (an arrow that leans on hover), the
  diagram canvas, and vendored shadcn atoms. Carried by `RailRow`, `GroupedList`, `TaskList`
  and `Thread`. Lint: `row-action-hover`.
- **Dividers and spacing.** Space groups, a hairline separates rows of the same kind. Never a
  divider between sections that already have space and a heading, and never `divide-y` inside
  a card that also pads its rows.
- **Page padding.** The shell panel sets the gutter, so a route's root has no `p-*`, `px-*` or
  `max-w-*`, apart from a reading measure. Lint: `page-width-cap`.
- **Type sizes.** Only the scale: `text-2xs` (11px, a count or meta line, the floor), `text-xs`,
  `text-(length:--text-control)` (13px), `text-sm`, `text-base` and up. Diagram nodes, drawn at
  canvas scale, are the exception. Lint: `raw-text-size`.

## Where the sources disagree

- **Press.** Emil uses `scale(0.97)` with a 0.95 to 0.98 range; Krehel says "Always use
  0.96"; `.t-press` is a 1px drop today. Until that changes, `.t-press` is the rule; nobody
  writes their own press.
- **Hit area.** Vercel floors at 24px and 44px on mobile, Krehel wants 40px in dense desktop
  UI. We take Vercel's, because 40px rows undo rule 19.
- **Easing.** Emil's ease-out is `cubic-bezier(0.23, 1, 0.32, 1)`, ours is
  `cubic-bezier(0.22, 1, 0.36, 1)`. The same curve within rounding, so ours stays.
- **Toasts.** Sonner runs 400ms on plain `ease`, past Emil's own 300ms cap. A toast isn't a
  press response, so the toast keeps Sonner's timing and the cap holds everywhere else.
- **Case.** Vercel title-cases buttons and headings and marks it a Vercel brand choice. We
  stay in sentence case.
- **Entrances.** Krehel's split entrance runs 800ms with staggered words. That's a marketing
  hero; the app keeps the 300ms cap.
