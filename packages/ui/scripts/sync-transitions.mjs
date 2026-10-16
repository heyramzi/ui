#!/usr/bin/env node
/*
 * Sync the free transitions.dev catalogue.
 */

/*
 * pnpm sync:transitions          fetch, vendor, report pnpm sync:transitions --check  fail if upstream moved (CI / pre-release)
 */

/*
 * Upstream ships every transition in one JSON with a `pro` flag.
 */

/*
 * Paid ones are dropped here and never vendored — Ramzi, 14 Sep 2026: "the pro effects we don't need them".
 */

/*
 * Everything free lands in `.upstream/transitions/` as the pristine copy; our adapted, token-fed version lives in `src/animations/`. PORTED maps one to the other. See ../src/animations/README.md.
 */

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  CHECK,
  fetchJson,
  githubHeadSha,
  readLock,
  removeDeep,
  report,
  sha256,
  writeFileDeep,
} from "#scripts/lib/sync-core.mjs";

const REPO = "Jakubantalik/transitions.dev";
const DATA = `https://raw.githubusercontent.com/${REPO}/main/scripts/transitions-data.json`;

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VENDOR = `${PKG}/.upstream/transitions`;
const LOCK = `${PKG}/.upstream/transitions.lock.json`;
const SRC = `${PKG}/src`;

/*
 * upstream slug -> the file under src/ that owns it.
 */

/*
 * Most land in src/animations. Five do not, because a component already did the job and one behaviour gets one implementation: the last five entries name where each went instead.
 */

/*
 * A slug absent from this map is reported as unported. The reasoning is in ../src/animations/README.md.
 */
const PORTED = {
  "card-resize": "animations/resize.css",
  "number-pop-in": "animations/digit-pop-in.css",
  "notification-badge": "animations/notification-badge.css",
  "text-states-swap": "animations/text-swap.css",
  "menu-dropdown": "animations/dropdown.css",
  "modal-open-close": "animations/modal.css",
  "panel-reveal": "animations/panel.css",
  "page-side-by-side": "animations/page-side-by-side.css",
  "icon-swap": "animations/icon-swap.css",
  "success-check": "animations/success-check.css",
  "avatar-group-hover": "animations/avatar-group-hover.css",
  "error-state-shake": "animations/input-shake.css",
  "input-clear-with-dissolve": "animations/input-clear-dissolve.css",
  "skeleton-loader-and-reveal": "animations/skeleton-reveal.css",
  "texts-reveal": "animations/texts-reveal.css",
  "tabs-sliding": "animations/tabs-sliding.css",
  "shimmer-text": "animations/shimmer-text.css",
  "tooltip-open-close": "animations/tooltip.css",
  "3d-tilt": "animations/card-tilt.css",
  "dropdown-menu-morph": "animations/plus-menu-morph.css",
  accordion: "animations/accordion.css",
  "like-button": "animations/like-button.css",
  "learn-more-hover": "animations/learn-more-hover.css",
  "spinning-counter": "animations/spinning-counter.css",
  "thinking-states": "animations/thinking-states.css",
  "reasoning-stream": "animations/reasoning-stream.css",
  "streaming-text": "animations/streaming-text.css",
  toggle: "shadcn/switch/switch.svelte",
  "checkbox-check": "shadcn/checkbox/checkbox.svelte",
  "toast-open-close": "shadcn/sonner/sonner.svelte",
  "banner-stacking": "shadcn/sonner/sonner.svelte",
  "matrix-dot-loader": "ai/loading-state/PixelLoader.svelte",
};

const catalogue = await fetchJson(DATA);
const free = catalogue.filter((t) => !t.pro);
const paid = catalogue.length - free.length;

const previous = (await readLock(LOCK))?.entries ?? {};
const entries = {};
const buckets = { added: [], changed: [], removed: [], unported: [] };
let unchanged = 0;

for (const { slug, name, css } of free) {
  const hash = sha256(css);
  entries[slug] = { name, sha256: hash, local: PORTED[slug] ?? null };

  if (!previous[slug]) buckets.added.push(`${slug} — ${name}`);
  else if (previous[slug].sha256 !== hash) buckets.changed.push(`${slug} — ${name}`);
  else unchanged++;

  if (!PORTED[slug]) buckets.unported.push(`${slug} — nothing under src/ owns it`);
  else if (!existsSync(`${SRC}/${PORTED[slug]}`))
    buckets.unported.push(`${slug} — PORTED says ${PORTED[slug]}, which is missing`);

  if (!CHECK) await writeFileDeep(`${VENDOR}/${slug}.css`, css);
}

for (const slug of Object.keys(previous)) {
  if (entries[slug]) continue;
  buckets.removed.push(`${slug} — gone upstream or moved to pro`);
  if (!CHECK) await removeDeep(`${VENDOR}/${slug}.css`);
}

if (!CHECK) {
  await writeFileDeep(
    LOCK,
    `${JSON.stringify(
      {
        source: `https://github.com/${REPO}`,
        data: DATA,
        ref: await githubHeadSha(REPO),
        fetchedAt: new Date().toISOString().slice(0, 10),
        free: free.length,
        skippedPro: paid,
        entries,
      },
      null,
      "\t",
    )}\n`,
  );
}

process.exit(
  report({
    title: `transitions.dev — ${free.length} free`,
    buckets,
    unchanged,
    footer: `${paid} pro skipped`,
  }),
);
