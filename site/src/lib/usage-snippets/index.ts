/**
 * The smallest markup that works, by page slug, shown under the import line in Usage. Cut from
 * each page's demo; `usage-snippets.test.ts` fails a tag the import doesn't export.
 */
import { actions } from "#lib/usage-snippets/actions.js";
import { blocks } from "#lib/usage-snippets/blocks.js";
import { display } from "#lib/usage-snippets/display.js";
import { inputs } from "#lib/usage-snippets/inputs.js";
import { overlays } from "#lib/usage-snippets/overlays.js";
import { visuals } from "#lib/usage-snippets/visuals.js";

const written: Record<string, string> = {
  ...actions,
  ...display,
  ...inputs,
  ...overlays,
  ...visuals,
  ...blocks,
};

export const usageSnippets: Record<string, string> = Object.fromEntries(
  Object.entries(written).map(([slug, markup]) => [slug, markup.trim()]),
);
