import type { Tone } from "#src/lib/tone.js";

/** "90", "45m", "1h", "1.5h", "1h30", "1h 30m" and "1:30" to whole minutes. Null when it isn't a duration. */
export function parseMinutes(text: string): number | null {
	const value = text.trim().toLowerCase();
	if (!value) return null;
	if (/^\d+$/.test(value)) return Number(value);
	const clock = /^(\d+):([0-5]?\d)$/.exec(value);
	if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
	const decimalHours = /^(\d+(?:[.,]\d+)?)\s*h$/.exec(value);
	if (decimalHours?.[1]) return Math.round(Number(decimalHours[1].replace(",", ".")) * 60);
	const parts = /^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m?)?$/.exec(value);
	if (!parts || (!parts[1] && !parts[2])) return null;
	return Number(parts[1] ?? 0) * 60 + Number(parts[2] ?? 0);
}

/** 150 to "2h 30m". */
export function formatMinutes(minutes: number): string {
	const whole = Math.max(0, Math.round(Number.isFinite(minutes) ? minutes : 0));
	const hours = Math.floor(whole / 60);
	const rest = whole % 60;
	if (hours === 0) return `${rest}m`;
	return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** Milliseconds to the timer readout, "1:05:09". */
export function formatClock(ms: number): { hours: string; minutes: string; seconds: string } {
	const total = Math.max(0, Math.floor(ms / 1000));
	return {
		hours: String(Math.floor(total / 3600)),
		minutes: String(Math.floor((total % 3600) / 60)).padStart(2, "0"),
		seconds: String(total % 60).padStart(2, "0"),
	};
}

/** The reader's own calendar day as `YYYY-MM-DD`. */
export function localDay(date: Date = new Date()): string {
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
}

/** "Today", "Yesterday", then "Mon, Oct 12", in the given locale. */
export function dayLabel(day: string, locale?: string): string {
	const date = new Date(`${day}T12:00:00`);
	const now = new Date();
	now.setHours(12, 0, 0, 0);
	const gap = Math.round((date.getTime() - now.getTime()) / 86_400_000);
	if (gap === 0 || gap === -1) {
		const word = new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(gap, "day");
		return word.charAt(0).toLocaleUpperCase(locale) + word.slice(1);
	}
	return date.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });
}

/** The tone of a budget: quiet until 90%, warning to 100%, destructive past it. */
export function budgetTone(logged: number, estimate: number | null | undefined): Tone {
	if (!estimate || estimate <= 0) return "neutral";
	const ratio = logged / estimate;
	if (ratio > 1) return "destructive";
	return ratio >= 0.9 ? "warning" : "neutral";
}

/** A stable color for a person, from their name or id. */
export function personColor(key: string): string {
	let hash = 0;
	for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) % 360;
	return `oklch(0.72 0.12 ${hash})`;
}
