/**
 * Analytics for apps that load the Umami script tag: one init call, then track, trackError,
 * trackRevenue and setProfileId. Nothing fires before `initAnalytics` or after its cleanup.
 */

/*
 * import { initAnalytics, track, trackError, trackRevenue, setProfileId } from "@heyramzi/marketing/analytics/unified";
 */

/*
 * initAnalytics({ providers: { umami: { websiteId: env.PUBLIC_UMAMI_WEBSITE_ID, host: env.PUBLIC_UMAMI_HOST } }, disabled: import.meta.env.DEV });
 */

/*
 * Umami has no native error endpoint and no profile id concept: trackError sends a custom event named "error" with surface/name/message, setProfileId calls window.umami.identify.
 */

import "#src/analytics/types.js";

export type EventData = Record<string, string | number | boolean | null | undefined>;

export type ErrorInput = {
  /** Error instance, string, or any value. */
  error: unknown;
  /** Where the error happened (e.g. "checkout-form", "stripe-webhook"). */
  surface?: string;
  /** Extra metadata. Coerced to strings. */
  data?: EventData;
};

export type RevenueArgs = {
  /** purchase_completed | subscription_started | subscription_renewed */
  event: string;
  /** In dollars (not cents). */
  value: number;
  /** ISO 4217 (e.g. USD, EUR). */
  currency: string;
  /** Plan name when relevant. */
  plan?: string;
  /** Stripe id for backend dedupe. */
  transactionId?: string;
};

export type UmamiOptions = {
  /** Umami website ID. */
  websiteId: string;
  /** Umami host without trailing slash. */
  host: string;
  /**
   * Inject the Umami script tag from the adapter. Default true. Set false if
   * the script is already in `app.html` or otherwise loaded.
   */
  autoInjectScript?: boolean;
  /** Collect Core Web Vitals (LCP, INP, CLS, FCP, TTFB). Umami v3.1+. Default false. */
  performance?: boolean;
  /** Group events under a named tag for filtering. Umami v2.11+. */
  tag?: string;
  /** Window function name to inspect/modify payloads before sending. Umami v2.18+. */
  beforeSend?: string;
  /** Restrict tracking to listed hostnames. Umami v2.0+. */
  domains?: string[];
  /** Honor the browser's Do-Not-Track signal. Umami v2.17+. Default false. */
  doNotTrack?: boolean;
  /** Disable automatic pageview/event tracking and call `umami.track()` manually. Default true. */
  autoTrack?: boolean;
  /** Strip URL search params from tracked URLs. Umami v2.11+. Default false. */
  excludeSearch?: boolean;
  /** Strip URL hash from tracked URLs. Umami v2.16+. Default false. */
  excludeHash?: boolean;
};

export type AnalyticsConfig = {
  /** Umami options. Omit the key to skip tracking entirely. */
  providers: { umami?: UmamiOptions };
  /** Skip tracking entirely (e.g., import.meta.env.DEV). */
  disabled?: boolean;
};

let active = false;
let options: UmamiOptions | null = null;

/**
 * Start tracking. Returns a cleanup function safe to return directly from a SvelteKit
 * `onMount` callback.
 */
export function initAnalytics(config: AnalyticsConfig): () => void {
  stop();
  if (config.disabled || typeof window === "undefined" || !config.providers.umami) return stop;

  options = config.providers.umami;
  active = true;
  injectScript(options);
  return stop;
}

function stop(): void {
  active = false;
  options = null;
}

/** Track a custom event. */
export function track(event: string, meta?: EventData): void {
  if (!active || typeof window === "undefined" || !window.umami) return;
  try {
    if (meta) {
      window.umami.track(event, meta);
    } else {
      window.umami.track(event);
    }
  } catch {
    // WHY: analytics must never break the app
  }
}

/** Report a captured error as a custom "error" event. */
export function trackError(input: ErrorInput): void {
  const fields = extractFields(input.error);
  const meta: EventData = { ...input.data, name: fields.name, message: fields.message };
  if (input.surface) meta.surface = input.surface;
  track("error", meta);
}

/** Fire a revenue event. */
export function trackRevenue(args: RevenueArgs): void {
  const meta: EventData = { revenue: args.value, currency: args.currency };
  if (args.plan) meta.plan = args.plan;
  if (args.transactionId) meta.transaction_id = args.transactionId;
  track(args.event, meta);
}

/** Set the cookieless profile id. */
export function setProfileId(id?: string): void {
  if (!active || typeof window === "undefined" || !window.umami?.identify) return;
  try {
    window.umami.identify(id ? { profileId: id } : {});
  } catch {
    // WHY: analytics must never break the app
  }
}

function injectScript(umami: UmamiOptions): void {
  if (typeof document === "undefined") return;
  if (!(umami.autoInjectScript ?? true)) return;
  if (document.querySelector(`script[data-website-id="${umami.websiteId}"]`)) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = `${umami.host.replace(/\/+$/, "")}/script.js`;
  script.dataset.websiteId = umami.websiteId;
  if (umami.performance) script.dataset.performance = "true";
  if (umami.tag) script.dataset.tag = umami.tag;
  if (umami.beforeSend) script.dataset.beforeSend = umami.beforeSend;
  if (umami.domains?.length) script.dataset.domains = umami.domains.join(",");
  if (umami.doNotTrack) script.dataset.doNotTrack = "true";
  if (umami.autoTrack === false) script.dataset.autoTrack = "false";
  if (umami.excludeSearch) script.dataset.excludeSearch = "true";
  if (umami.excludeHash) script.dataset.excludeHash = "true";
  document.head.appendChild(script);
}

function extractFields(error: unknown): { name: string; message: string } {
  if (error instanceof Error) return { name: error.name || "Error", message: error.message };
  if (typeof error === "string") return { name: "Error", message: error };
  try {
    return { name: "Error", message: JSON.stringify(error) };
  } catch {
    return { name: "Error", message: String(error) };
  }
}
