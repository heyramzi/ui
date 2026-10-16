/**
 * Svelte component for loading the Umami script tag.
 */

/*
 * Usage in +layout.svelte: import { umamiScriptAttrs } from "@heyramzi/marketing/analytics/svelte";
 */

/*
 * <svelte:head> <script defer {...umamiScriptAttrs("website-id")} /> </svelte:head>
 */

/*
 * Or with beforeSend: define window.umamiBeforeSend yourself and pass its name below.
 */

/*
 * <script defer {...umamiScriptAttrs("website-id", { beforeSend: "umamiBeforeSend" })} />
 */

const DEFAULT_HOST = "https://your-umami-instance.com";

type ScriptOptions = {
  hostUrl?: string;
  domains?: string[];
  beforeSend?: string;
  doNotTrack?: boolean;
  performance?: boolean;
  tag?: string;
};

/** Generate attributes for the Umami script tag. */
export function umamiScriptAttrs(
  websiteId: string,
  options?: ScriptOptions,
): Record<string, string> {
  const host = options?.hostUrl ?? DEFAULT_HOST;
  const attrs: Record<string, string> = {
    src: `${host}/script.js`,
    "data-website-id": websiteId,
  };
  if (options?.domains?.length) {
    attrs["data-domains"] = options.domains.join(",");
  }
  if (options?.beforeSend) {
    attrs["data-before-send"] = options.beforeSend;
  }
  if (options?.doNotTrack) {
    attrs["data-do-not-track"] = "true";
  }
  if (options?.performance) {
    attrs["data-performance"] = "true";
  }
  if (options?.tag) {
    attrs["data-tag"] = options.tag;
  }
  return attrs;
}

/** Preconnect link attributes for the Umami host. */
export function umamiPreconnectAttrs(hostUrl?: string): {
  preconnect: Record<string, string>;
  dnsPrefetch: Record<string, string>;
} {
  const host = hostUrl ?? DEFAULT_HOST;
  return {
    preconnect: { rel: "preconnect", href: host },
    dnsPrefetch: { rel: "dns-prefetch", href: host },
  };
}
