/** The "Edited Oct 23" chip: how a stamp reads, and what to show when it can't be read. */

export type DateInput = Date | string | number | null | undefined;

export type StampOptions = {
  /** The clock, so a test doesn't depend on today. */
  now?: Date;
  locale?: string;
  timeZone?: string;
};

export function parseStamp(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function yearOf(date: Date, { locale = "en-US", timeZone }: StampOptions) {
  return new Intl.DateTimeFormat(locale, { year: "numeric", timeZone }).format(date);
}

/** "Oct 23", or "Oct 23, 2025" when it isn't this year. Empty when the date can't be read. */
export function shortDate(value: DateInput, options: StampOptions = {}): string {
  const date = parseStamp(value);
  if (!date) return "";
  const { locale = "en-US", timeZone, now = new Date() } = options;
  const sameYear = yearOf(date, options) === yearOf(now, options);
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
    timeZone,
  }).format(date);
}

/** "Oct 23, 14:44" for the last-edit row. Empty when the date can't be read. */
export function editStamp(value: DateInput, options: StampOptions = {}): string {
  const date = parseStamp(value);
  if (!date) return "";
  const { locale = "en-US", timeZone } = options;
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
  return `${shortDate(date, options)}, ${time}`;
}

/** The chip's text. `label` is the word ("Edited"); a bad date leaves only the word. */
export function editedLabel(value: DateInput, label = "Edited", options: StampOptions = {}) {
  const day = shortDate(value, options);
  return day ? `${label} ${day}` : label;
}
