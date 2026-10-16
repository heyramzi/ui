/**
 * The OpenScreen backend's host side: the feature gate, its studio routes and UI conversions, with no DOM so it tests alone.
 */

import type { ReviewBackend, ReviewModel } from "#src/core/types.js";

/** What the studio's `/features` route answers, whether the gate is on and whether the app is there. */
export type Features = { openscreen: boolean; openscreenInstalled: boolean };

/** The gate is shut until the studio says otherwise, so an unread answer is off. */
export const FEATURES_OFF: Features = { openscreen: false, openscreenInstalled: false };

/** The routes Worker C serves on the studio. The UI calls these and never touches OpenScreen. */
export const OPENSCREEN_ROUTES = {
  features: "/features",
  pair: "/projects/openscreen/pair",
  record: "/projects/openscreen/record",
  preview: "/projects/openscreen/preview",
  sync: "/projects/openscreen/sync",
  export: "/projects/openscreen/export",
} as const;

/** The OpenScreen build this UI was written against. Anything older is untested. */
export const OPENSCREEN_TESTED_VERSION = "1.13.0";

/** Homebrew has no cask for OpenScreen, so the install line points at the releases page. */
export const OPENSCREEN_RELEASES = "https://github.com/getopenscreen/openscreen/releases";

/** A route's answer. `out` carries the exported file's path. */
export type HostResult = { ok: true; out?: string } | { ok: false; error: string };

/**
 * POST one studio route: a body with `ok` is taken as is, a bare 2xx counts as success, and every failure becomes readable text.
 */
export async function hostPost(path: string, body: unknown): Promise<HostResult> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const answer: unknown = await response.json().catch(() => null);
    if (typeof answer === "object" && answer !== null) {
      const record = answer as Record<string, unknown>;
      if ("ok" in record) return record as HostResult;
      if (!response.ok && typeof record.error === "string" && record.error)
        return { ok: false, error: record.error };
    }
    if (response.ok) return { ok: true };
    return { ok: false, error: response.statusText || "The studio didn't answer." };
  } catch {
    return { ok: false, error: "Couldn't reach the studio." };
  }
}

/** The gate is open only when the studio says so. A missing answer keeps it shut. */
export function gateOpen(features: Features | null | undefined): boolean {
  return features?.openscreen === true;
}

/** A model is on the OpenScreen backend when its adapter says so. */
export function isOpenScreen(model: Pick<ReviewModel, "backend"> | null | undefined): boolean {
  return model?.backend === "openscreen";
}

/** Read the `/features` body without trusting its shape. */
export function readFeatures(value: unknown): Features {
  const body = (typeof value === "object" && value !== null ? value : {}) as Record<
    string,
    unknown
  >;
  return {
    openscreen: body.openscreen === true,
    openscreenInstalled: body.openscreenInstalled === true,
  };
}

/** Seconds from a field into whole milliseconds. A blank or unreadable value means no offset. */
export function secondsToMs(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const text = String(value).trim();
  if (text === "") return 0;
  const seconds = Number(text);
  return Number.isFinite(seconds) ? Math.round(seconds * 1000) : 0;
}

export type PairFields = { name: string; screen: string; camera: string; offset: string | number };

/** What the pair route's body wants: trimmed paths and the offset in milliseconds. */
export function pairBody(fields: PairFields): {
  name: string;
  screen: string;
  camera: string;
  offsetMs: number;
} {
  return {
    name: fields.name.trim(),
    screen: fields.screen.trim(),
    camera: fields.camera.trim(),
    offsetMs: secondsToMs(fields.offset),
  };
}

/** What the form still needs before it can send. Empty means it can. */
export function pairProblem(fields: Pick<PairFields, "name" | "screen">): string {
  if (!fields.name.trim()) return "Name the video first.";
  if (!fields.screen.trim()) return "Add the screen recording.";
  return "";
}

/** A route's error as one line a person reads, or an empty line when it worked. */
export function resultText(result: HostResult | null | undefined): string {
  if (!result || result.ok) return "";
  return result.error || "That didn't work.";
}

/** The backend a model runs on, defaulting to what every existing video uses. */
export function backendOf(model: Pick<ReviewModel, "backend">): ReviewBackend {
  return model.backend ?? "descript";
}
