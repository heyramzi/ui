# Changelog

## Unreleased

### Features

* feat(charts): `Sparkline` `height` takes any CSS length as well as pixels
* feat(charts): `RingChart` takes children, a snippet that replaces the center readout
* feat(charts): `BarChart` takes `details`, extra tooltip rows for a second measure of the same row
* feat(charts): `@heyramzi/charts/dashboard`, a page kit for a reporting screen: `DashboardSection`, `PanelGrid`, `StatBand`, `StatTile`, `DataPanel`, `DashboardEmpty`, `MetricTable`, `DataSortHead`, `RatingChip`, `PeriodFilter`, `DAY_WINDOWS`, `CHART_HEIGHT` and the table skin classes; it needs `@heyramzi/ui` 8 or newer, so the optional peer moves from 6 to 8

## [1.0.0](https://github.com/heyramzi/ui/releases/tag/charts-v1.0.0) (2026-10-16)

_Released as 1.0.0 before the 19 Oct 2026 renumbering (the number did not change)._

### Features

* feat(charts)!: the charts move out of @heyramzi/ui into @heyramzi/charts


## [1.1.0](https://github.com/heyramzi/ui/compare/charts-v1.0.0...charts-v1.1.0) (2026-10-16)

_Released as 2.0.0 before the 19 Oct 2026 renumbering._

### Features

* initial publish from this repo


## [1.2.0](https://github.com/heyramzi/ui/compare/charts-v1.1.0...charts-v1.2.0) (2026-10-20)

### Features

* feat(charts): DataTable replaces MetricTable, a loss reads red and a share past 100% reads true

### Bug Fixes

* fix(charts): the number card's hover border waits for a fine pointer
* fix(charts): the share fill scales instead of animating width

