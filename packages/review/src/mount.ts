import { mount, unmount } from "svelte";
import { createHttpClient, type ReviewClient } from "#src/client/http.js";
import type { Features } from "#src/core/openscreen.js";
import App from "#src/ui/App.svelte";
import Labs from "#src/ui/Labs.svelte";
import LayoutLibrary from "#src/ui/LayoutLibrary.svelte";
import SoundLibrary from "#src/ui/SoundLibrary.svelte";
import type { LibraryCard, SoundCard } from "#src/core/types.js";
import StartChoice from "#src/ui/StartChoice.svelte";
import { ensureSprite } from "#src/ui/sprite.js";
import "#src/theme/tokens.css";
import "#src/theme/base.css";

export type MountOptions = {
  /** URL prefix the server handler was created with, e.g. "/review". */
  base: string;
  /** The video id. */
  id: string;
  /** Where the Back button goes. */
  backHref?: string;
  /** The video's width over its height, when the host knows it before anything loads. The skeleton and the players start in that shape, not 16:9. */
  ratio?: number;
  /** Swap the HTTP client, for tests. */
  client?: ReviewClient;
};

export type MountedReview = { destroy(): void };

/** A component a host page mounts on its own, out of the review page's way. */
export type MountedHost = { destroy(): void };

/** Draw the review page into `target`. The target should have a height, the page fills it. */
export function mountReview(target: HTMLElement, opts: MountOptions): MountedReview {
  ensureSprite();
  target.replaceChildren();
  const app = mount(App, {
    target,
    props: {
      client: opts.client ?? createHttpClient({ base: opts.base, id: opts.id }),
      backHref: opts.backHref ?? "/",
      ratio: opts.ratio,
    },
  });
  return { destroy: () => void unmount(app) };
}

export type StartChoiceOptions = {
  /** The Descript prompt the card offers, the same line the shelf already says to the agent. */
  say?: string;
  /** Read the gate before mounting, so a test can stand in for `/features`. */
  features?: Features;
  /** Told the gate, so the host can hide a duplicate prompt when it is on. */
  onFeatures?: (features: Features) => void;
};

/**
 * A wrapper carrying `.rv`, because Svelte's mount writes the component's class onto the target, which can't be a host node with its own classes.
 */
function rvHost(target: HTMLElement): HTMLElement {
  const host = document.createElement("div");
  host.className = "rv";
  target.replaceChildren(host);
  return host;
}

/** Draw the "Start with" choice into `target`. The gate off draws nothing at all. */
export function mountStartChoice(target: HTMLElement, opts: StartChoiceOptions = {}): MountedHost {
  ensureSprite();
  const app = mount(StartChoice, {
    target: rvHost(target),
    props: { say: opts.say, features: opts.features, onFeatures: opts.onFeatures },
  });
  return { destroy: () => void unmount(app) };
}

/** Draw every card of a layout pack into `target`, grouped and searchable. */
export function mountLayoutLibrary(
  target: HTMLElement,
  opts: { layouts: LibraryCard[] },
): MountedHost {
  ensureSprite();
  const app = mount(LayoutLibrary, { target: rvHost(target), props: { layouts: opts.layouts } });
  return { destroy: () => void unmount(app) };
}

/** Draw every sound of a roster into `target`: playable, grouped and searchable. */
export function mountSoundLibrary(target: HTMLElement, opts: { sounds: SoundCard[] }): MountedHost {
  ensureSprite();
  const app = mount(SoundLibrary, { target: rvHost(target), props: { sounds: opts.sounds } });
  return { destroy: () => void unmount(app) };
}

/** Draw the setup page's Labs toggle into `target`. */
export function mountLabs(
  target: HTMLElement,
  opts: { features?: Features; onFeatures?: (features: Features) => void } = {},
): MountedHost {
  ensureSprite();
  const app = mount(Labs, {
    target: rvHost(target),
    props: { features: opts.features, onFeatures: opts.onFeatures },
  });
  return { destroy: () => void unmount(app) };
}
