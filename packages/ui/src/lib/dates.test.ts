import { describe, expect, it } from "vite-plus/test";
import { formatAge } from "#src/record/format.js";
import { localDay as recordDay } from "#src/record/logic.js";
import { whenOf } from "#src/work/inbox/inbox-logic.js";
import { editStamp, editedLabel, shortDate as editedDate } from "#src/work/docs/edited.js";
import { todayIso } from "#src/work/dates.js";
import { localDay as timeDay } from "#src/work/time/duration.js";

// The modules that kept their own date names, pinned so the shared helpers can't change a string.
// 10:00 UTC is the same calendar day from Hawaii to Auckland, so whenOf's date holds in any zone.
const NOW = Date.parse("2026-10-23T10:00:00Z");
const ago = (seconds: number) => new Date(NOW - seconds * 1000).toISOString();

describe("relative time", () => {
  it("formatAge says it in long words", () => {
    expect(formatAge(ago(20), NOW)).toBe("now");
    expect(formatAge(ago(3 * 86_400), NOW)).toBe("3 days ago");
    expect(formatAge(ago(-14 * 86_400), NOW)).toBe("in 2 weeks");
    expect(formatAge(ago(70 * 86_400), NOW)).toBe("2 months ago");
    expect(formatAge(ago(400 * 86_400), NOW)).toBe("last year");
  });

  it("whenOf says it short, then turns to a date at four weeks", () => {
    expect(whenOf(ago(3 * 3_600), NOW)).toBe("3 hr ago");
    expect(whenOf(ago(86_400), NOW)).toBe("yesterday");
    expect(whenOf(ago(40 * 86_400), NOW)).toBe("13 Sept");
    expect(whenOf(ago(40 * 86_400), NOW, "en-US")).toBe("Sep 13");
    expect(whenOf("Tuesday", NOW)).toBe("Tuesday");
    expect(whenOf("2026-13-45T00:00:00Z", NOW)).toBe("");
  });
});

describe("short date", () => {
  const options = { now: new Date(NOW), timeZone: "UTC" };

  it("adds the year only when it isn't this one", () => {
    expect(editedDate("2026-10-23T08:00:00Z", options)).toBe("Oct 23");
    expect(editedDate("2025-10-23T08:00:00Z", options)).toBe("Oct 23, 2025");
    expect(editedDate("not a date", options)).toBe("");
  });

  it("builds the edited chip and stamp on it", () => {
    expect(editStamp("2026-10-23T14:44:00Z", options)).toBe("Oct 23, 14:44");
    expect(editedLabel("2026-10-23T14:44:00Z", "Edited", options)).toBe("Edited Oct 23");
    expect(editedLabel(null, "Edited", options)).toBe("Edited");
  });
});

describe("local day", () => {
  it("reads a timestamp's day in the given zone", () => {
    expect(recordDay("2026-10-23T23:30:00Z", "Europe/Paris")).toBe("2026-10-24");
    expect(recordDay("2026-10-23T23:30:00Z", "UTC")).toBe("2026-10-23");
  });

  it("reads a date's day in the viewer's zone", () => {
    expect(timeDay(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(recordDay(new Date(2026, 0, 5, 0, 1).toISOString())).toBe("2026-01-05");
  });

  it("today matches across the modules", () => {
    expect(todayIso()).toBe(timeDay());
  });
});
