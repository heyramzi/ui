---
paths:
  - "**/*.swift"
---
<!-- vibekit:rule -->
<!-- Generated from upsys/kit/ai-doc/rules/. Edit there, then run: node upsys/kit/ai-doc/scripts/sync-agents-core.cjs -->

# Liquid Glass, tokens and contrast (iOS 26+, macOS 26+)

`kit/swift/lint/house.swiftlint.yml` fails the mechanical half at commit and its message names the fix. These are the calls it can't make.

- **Every token comes from the app's design file** (`<App>Design.swift`, `Tokens.swift`, `*System.swift`, `Theme.swift`): type, colour, weight, radius, shadow, glass, control size. The lint fails the literal anywhere else, so when no token fits, add one there.
- **Glass is the functional layer, content stays opaque.** Bars, toolbars and floating controls get system glass (`.buttonStyle(.glass)`, `TabView`, `.toolbar`, `.searchable`), else the design file's glass helper (`house_raw_glass_effect`). A card, row or sheet body is an opaque fill (glass on a sheet's glass, 16 Oct 2026). Glass shapes side by side share one `GlassEffectContainer` (`house_glass_container_blends_row`).
- **One elevation per surface, never shadow on shadow.** An opaque card takes the app's elevation token (`house_raw_shadow`; flat cards were "not elevated enough", TSK-3662). Glass takes none (`house_shadow_on_glass`). A shadowed card inside a shadowed card or a sheet: flatten the inner one.
- **A card or row holds at most 2 type roles and 1 accent colour.** A third style or second hue means the row does 2 jobs: split it or cut one.
- **Text buttons use the system capsule or the radius scale, icon buttons are circles.** A glass or bordered style pads a lone glyph into a capsule, so the round send button comes out oval: `house_glass_icon_button_shape`, `house_icon_label_button_shape` and `house_circle_unequal_frame` want `.buttonBorderShape(.circle)` on one square size token.

## Exact, not linted yet

- Controls in one row share one height token. A literal `44` or `.frame(height: 36)` on a control drifts.
- A shared control keeps its icon on every platform: no `.labelStyle(.titleOnly)` in `#if os(iOS)`; a row too tight scrolls or uses `ViewThatFits` (TSK-3751).
- A file drawing a custom material reads `@Environment(\.accessibilityReduceTransparency)` and swaps in a solid fill.

## Checked on a capture

- iOS hit targets 44pt, measured on the content shape, not the glyph.
- WCAG AA (4.5:1 text, 3:1 glyphs) against glass over the lightest and darkest content that scrolls under it. Tinted text fails first.
- Dynamic Type to AX5 without clipping: no fixed height on a text container.
