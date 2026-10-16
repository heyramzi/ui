/** A running timer. The host persists it, the tracker only reads it. */
export type TimeRunning = {
	startedAt: Date | string | number;
};

/** What the tracker hands back when a manual entry is submitted. */
export type TimeLogInput = {
	minutes: number;
	/** The day worked, `YYYY-MM-DD`. */
	day: string;
	note?: string;
};

/** What the tracker hands back when the timer stops. */
export type TimeStopInfo = {
	/** Elapsed whole minutes, never below 1. */
	minutes: number;
	startedAt: Date;
	stoppedAt: Date;
	/** The day it started, `YYYY-MM-DD`, in the reader's calendar. */
	day: string;
};

export type TimeLabels = {
	title: string;
	timer: string;
	start: string;
	stop: string;
	running: string;
	since: (time: string) => string;
	started: string;
	runningFor: (duration: string) => string;
	stopped: (duration: string) => string;
	elapsed: string;
	logged: string;
	duration: string;
	durationPlaceholder: string;
	date: string;
	note: string;
	notePlaceholder: string;
	log: string;
	saving: string;
	invalid: string;
	empty: string;
	remaining: (left: string, estimate: string) => string;
	over: (over: string, estimate: string) => string;
	deleteEntry: (duration: string) => string;
};

export const DEFAULT_TIME_LABELS: TimeLabels = {
	title: "Time",
	timer: "Timer",
	start: "Start timer",
	stop: "Stop timer",
	running: "Running",
	since: (time) => `Since ${time}`,
	started: "Timer started",
	runningFor: (duration) => `Timer running, ${duration}`,
	stopped: (duration) => `Timer stopped, ${duration} to log`,
	elapsed: "Elapsed time",
	logged: "Logged",
	duration: "Time spent",
	durationPlaceholder: "1h30",
	date: "Date worked",
	note: "Note",
	notePlaceholder: "What was done",
	log: "Log",
	saving: "Saving",
	invalid: "Try 45m, 1h30 or 1.5h",
	empty: "Log your first hour",
	remaining: (left, estimate) => `${left} left of ${estimate}`,
	over: (over, estimate) => `${over} over ${estimate}`,
	deleteEntry: (duration) => `Delete ${duration} entry`,
};
