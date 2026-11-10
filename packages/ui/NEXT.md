### Changes

* `TagsInput` opens its suggestions in a portal on Bits UI's `Combobox`, so a parent with `overflow: hidden` no longer cuts the list off, and with `free` set the box is a plain text field instead of a combobox.
* `FilterPopover` is a menu on Bits UI's `DropdownMenu` and `FilterItem` a checkable menu item: arrows, Home, End and a letter move through the options. A plain button placed inside `FilterPopover` is no longer reachable by keyboard, so make it a `FilterItem`.
* `SegmentedFilter` is one Tab stop with arrow keys, and its segments announce as radios. The canvas tool rail, style bar and style panel, the deck controls and the editor toolbar are Bits UI toolbars: one Tab stop each, arrows inside.
* `RichEditor` toolbar buttons are named without their shortcut (`Bold`, not `Bold (Cmd+B)`); the shortcut shows in a tooltip. Headings announce as radios. The link field opens in a popover under the link button.
* `RichEditor` asks for an image or video link in a dialog instead of `window.prompt()`, shows a bad link's error under the field, and refuses a `javascript:` image link.
* The image toolbar flips below the image when there's no room above and can be reached with Tab.
* `ThemeToggle` with `variant="slide"` is a switch; its default name is `Dark mode`.
* `GroupedList` headers move with the arrow keys. `TaskList` groups, the kanban hidden rail and "Show more", `TableView` group headers and the inbox snooze button name what they control.
* `TimeTracker` shows its budget as a meter and two trackers on one page no longer share an id.
* `Legend` rows are plain list items and no longer take a Tab stop; hovering one still reports `hoveredIndex`.
* `Picker` takes an array `value` for a multi-select that stays open after a pick.
* Dashboard `hint` texts on `RatingChip` and `DataTable` open as tooltips on keyboard focus.

### Fixes

* Opening the `TimeTracker` popover threw `props_invalid_value` and blanked the tracker.
* `RichEditor` toolbar buttons kept their old pressed state after an edit.
* The canvas keeps focus on a node after Esc, so tool letters keep working.
