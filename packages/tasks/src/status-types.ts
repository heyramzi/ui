import type { Component } from "svelte";
import type { Tone } from "@heyramzi/ui/lib/tone.js";

/**
 * The shape the dot can take. `progress` needs a `progress` value between 0 and 1.
 * `dashed` is an open ring cut into dashes, for an aggregate such as "All".
 */
export type StatusDotVariant = "open" | "dashed" | "progress" | "filled" | "completed" | "lost";

export type StatusDef = {
	label: string;
	tone?: Tone;
	/** Any Svelte component, for example a Phosphor icon. Renders inside StatusIcon. */
	icon?: Component;
	variant?: StatusDotVariant;
	/** 0 to 1. Only used by the `progress` variant. */
	progress?: number;
	/** Optional CSS color. Overrides the tone color for the dot and icon. */
	color?: string;
	description?: string;
};

export type StatusMap = Record<string, StatusDef>;

export type StatusId<M extends StatusMap> = keyof M & string;

/** What the components accept. `defineStatuses` returns this plus a typed `ids`. */
export type Statuses = {
	/** The raw map. Kept loose so a registry with specific keys is assignable here. */
	map: StatusMap;
	ids: string[];
	has(id: string): boolean;
	get(id: string): StatusDef | undefined;
	label(id: string): string;
	tone(id: string): Tone;
	icon(id: string): Component | undefined;
	variant(id: string): StatusDotVariant;
	progress(id: string): number | undefined;
	color(id: string): string | undefined;
};
