import { renderWords } from "#src/core/render-words.js";
import type { JobStatus, RenderProgress } from "#src/core/types.js";

/**
 * The preview file the player should hold. A render rewrites the file in pieces, so the new one
 * waits until the studio says the render is over; a tool that doesn't render has nothing to wait for.
 */
export function previewToShow(
  shown: string | undefined,
  next: string | undefined,
  state: JobStatus["state"] | undefined,
): string | undefined {
  return state === "queued" || state === "rendering" ? shown : next;
}

/** What a preview render with no progress feed shows: how far along it probably is, and how the time left reads. The page words it. */
export type RenderEstimate = {
  fraction: number;
  pace: "left" | "soon" | "late";
  /** For pace `left`: the time left, rounded the way a person says it. */
  seconds: number;
};

/** A new project has no past renders, so a preview is guessed at half its length, and never under 15 seconds. */
export const guessedRenderMs = (videoSeconds: number): number =>
  Math.max(15, videoSeconds * 0.5) * 1000;

/**
 * Time against the expected render, eased so the bar never claims the end: 90% at the expected
 * time, closing on 95% after. The studio only knows when the render is over, so 100% is its to say.
 */
export function renderEstimate(elapsedMs: number, expectedMs: number): RenderEstimate {
  const expected = Math.max(expectedMs, 1000);
  const fraction = 0.95 * (1 - Math.exp((-3 * Math.max(elapsedMs, 0)) / expected));
  const left = (expected - elapsedMs) / 1000;
  if (elapsedMs > expected * 1.25) return { fraction, pace: "late", seconds: 0 };
  if (left < 5) return { fraction, pace: "soon", seconds: 0 };
  const seconds = left < 60 ? Math.round(left / 5) * 5 : Math.round(left / 15) * 15;
  return { fraction, pace: "left", seconds };
}

/**
 * The renderer's own progress as a bar and a percent. The matte is about two thirds of a preview's wait
 * (140s of 215s on P04), so it gets half the bar and the parts the other half.
 */
export function progressOf(progress: RenderProgress): { fraction: number; words: string } {
  if (progress.stage === "preparing") return { fraction: 0.03, words: "getting ready" };
  if (progress.stage === "finishing") return { fraction: 0.97, words: "almost done" };
  const share = progress.total > 0 ? progress.done / progress.total : 0;
  const fraction = progress.stage === "matting" ? 0.05 + 0.5 * share : 0.55 + 0.4 * share;
  const percent = `${Math.round(fraction * 100)}%`;
  // The encode of a whole picture is minutes of one melt: it says so, instead of sitting at the matte's 55%.
  return { fraction, words: progress.stage === "encoding" ? `encoding ${percent}` : percent };
}

/** The studio route that starts a final render of this video. */
export const finalRoute = (id: string): string => `/p/${encodeURIComponent(id)}/render`;

/** What the Render final button says, and whether it can be pressed. A final that's in line, drawing or up to date can't be asked for again. */
export function finalButton(final: JobStatus): { label: string; disabled: boolean; tip?: string } {
  switch (final.state) {
    case "queued":
      return {
        label: renderWords.queued("final", final.ahead === 0 ? 0 : undefined),
        disabled: true,
      };
    case "rendering":
      return {
        label: final.progress
          ? `${renderWords.making("final")}, ${progressOf(final.progress).words}`
          : renderWords.making("final"),
        disabled: true,
      };
    case "current":
      return { label: "Final is up to date", disabled: true };
    case "failed":
      return { label: "Render final", disabled: false, tip: "The last try didn't finish. Try again." };
    case "outdated":
      return { label: "Render final", disabled: false, tip: "The video changed since the last final" };
    case "none":
      return { label: "Render final", disabled: false };
  }
}
