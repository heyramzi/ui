/**
 * Umami reporting API client, the read side of Umami.
 */

/*
 * `protocol.ts` and `client.ts` write events into Umami. This reads them back out: websites, stats, metrics, time-series, sessions and live visitors. Reference: https://docs.umami.is/docs/api
 */

/*
 * WHY one client for every runtime: the same dashboard is served from a Cloudflare Worker, a Node server and a terminal CLI.
 */

/*
 * Transport is the only thing that differs between them, so it is the only thing injected.
 */

// ── Transport ──

/**
 * The subset of `fetch` this client uses.
 */

/*
 * Structural on purpose: Node's global fetch, a Worker's fetch and undici's fetch all satisfy it, so a caller that needs a custom dispatcher (a pinned DNS resolution,
 */

/*
 * a proxy) can wrap its own without this module importing undici.
 */
export type UmamiFetch = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
}>;

// ── Auth ──

export type UmamiAuthResponse = {
  token: string;
  user: { id: string; username: string };
};

// ── Websites ──

export type UmamiReport = {
  id: string;
  websiteId: string;
  type: "funnel" | "goal" | "journey" | "retention" | "revenue" | "attribution" | "utm";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type UmamiWebsite = {
  id: string;
  name: string;
  domain: string;
  shareId: string | null;
  resetAt: string | null;
  userId: string | null;
  teamId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type UmamiWebsitesResponse = {
  data: UmamiWebsite[];
  count: number;
  page: number;
  pageSize: number;
};

// ── Stats ──

export type UmamiStatsCore = {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
};

/**
 * WHY `comparison` and not `{ value, prev }`: Umami returns the current window flat and the preceding window of equal length under `comparison`.
 */

/*
 * Older docs describe a `{ value, prev }` shape per metric; the self-hosted server does not send it, and typing it that way yields `undefined` at every call site.
 */
export type UmamiStatsResponse = UmamiStatsCore & {
  comparison?: UmamiStatsCore;
};

// ── Active visitors ──

export type UmamiActiveResponse = {
  visitors: number;
};

// ── Date range ──

export type UmamiDateRangeResponse = {
  startDate: string;
  endDate: string;
};

// ── Metrics ──

export type UmamiMetric = {
  x: string;
  y: number;
};

export type UmamiMetricType =
  | "path"
  | "entry"
  | "exit"
  | "title"
  | "query"
  | "referrer"
  | "browser"
  | "os"
  | "device"
  | "country"
  | "region"
  | "city"
  | "language"
  | "screen"
  | "event"
  | "hostname"
  | "tag"
  | "distinctId";

export type UmamiExpandedMetricRaw = {
  name: string;
  pageviews: string | number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: string | number;
};

export type UmamiExpandedMetric = {
  name: string;
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
};

// ── Pageviews (time-series) ──

export type UmamiPageviewsEntry = {
  x: string;
  y: number;
};

export type UmamiPageviewsResponse = {
  pageviews: UmamiPageviewsEntry[];
  sessions: UmamiPageviewsEntry[];
};

// ── Events ──

export type UmamiEvent = {
  id: string;
  websiteId: string;
  sessionId: string;
  createdAt: string;
  urlPath: string | null;
  urlQuery: string | null;
  referrerPath: string | null;
  referrerQuery: string | null;
  referrerDomain: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  pageTitle: string | null;
  eventType: number;
  eventName: string | null;
};

export type UmamiPaginated<T> = {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
};

export type UmamiEventsResponse = UmamiPaginated<UmamiEvent>;

export type UmamiEventSeriesEntry = {
  x: string;
  t: string;
  y: number;
};

// ── Event data ──

/** One (event, field) pair that carried numeric or string data, with its count. */
export type UmamiEventDataStat = {
  eventName: string;
  fieldName: string;
  total: number;
};

/** One recorded value of an event field. `value` is raw, so revenue arrives as a string. */
export type UmamiEventDataValue = {
  value: string;
  total: number;
};

// ── Sessions ──

export type UmamiSession = {
  id: string;
  websiteId: string;
  hostname: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  screen: string | null;
  language: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  firstAt: string;
  lastAt: string;
  visits: number;
  views: number;
  events: number;
  createdAt: string;
};

export type UmamiSessionsResponse = UmamiPaginated<UmamiSession>;

// ── Credentials ──

export type UmamiReportingCredentials = {
  apiUrl: string;
  username?: string;
  password?: string;
  /** Umami Cloud key. Replaces the login; `apiUrl` is then `https://api.umami.is/v1`. */
  apiKey?: string;
  /** Cloud's free plan has no key: the `__Secure-umami.session_token` cookie, as `name=value`. */
  sessionCookie?: string;
  /** Include websites owned by this team alongside the personal ones. */
  teamId?: string;
  /**
   * Cloudflare Access service token.
   */

  /*
   * WHY: an Umami host behind Access answers an unauthenticated API call with a 302 to the login page, whose HTML body parses as "no websites" rather than as an error.
   */
  accessClientId?: string;
  accessClientSecret?: string;
  /** Transport override. Defaults to the runtime's global fetch. */
  fetchImpl?: UmamiFetch;
};

const TOKEN_TTL_MS = 30 * 60 * 1000;
const WEBSITE_LIST_TTL_MS = 10 * 60 * 1000;
const PAGE_SIZE = 150;

export class UmamiReportingClient {
  private baseUrl: string;
  private username?: string;
  private password?: string;
  private apiKey?: string;
  private sessionCookie?: string;
  private teamId?: string;
  private accessHeaders: Record<string, string>;
  private fetchImpl: UmamiFetch;

  private cachedToken: string | null = null;
  private tokenExpiry = 0;
  private cachedWebsites: UmamiWebsite[] | null = null;
  private websitesExpiry = 0;

  constructor(credentials: UmamiReportingCredentials) {
    this.baseUrl = credentials.apiUrl.replace(/\/+$/, "");
    this.username = credentials.username;
    this.password = credentials.password;
    this.apiKey = credentials.apiKey;
    this.sessionCookie = credentials.sessionCookie;
    this.teamId = credentials.teamId;
    this.accessHeaders =
      credentials.accessClientId && credentials.accessClientSecret
        ? {
            "CF-Access-Client-Id": credentials.accessClientId,
            "CF-Access-Client-Secret": credentials.accessClientSecret,
          }
        : {};

    const injected = credentials.fetchImpl;
    if (!injected && typeof globalThis.fetch !== "function") {
      throw new Error("No fetch available. Pass fetchImpl to UmamiReportingClient.");
    }
    this.fetchImpl = injected ?? ((url, init) => globalThis.fetch(url, init));
  }

  // ── Auth ──

  private async getToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiry) return this.cachedToken;

    const response = await this.fetchImpl(`${this.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.accessHeaders },
      // WHY both keys: Umami matches on `username`, but a server configured for
      // email login reads `email`. Sending both covers either without a probe.
      body: JSON.stringify({
        username: this.username,
        email: this.username,
        password: this.password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Umami auth failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as UmamiAuthResponse;
    this.cachedToken = data.token;
    this.tokenExpiry = Date.now() + TOKEN_TTL_MS;
    return data.token;
  }

  private async request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
    // Cloud serves the same routes without the `/api` prefix, under `/v1`.
    const url = this.apiKey
      ? `${this.baseUrl}${path.replace(/^\/api/, "")}`
      : `${this.baseUrl}${path}`;
    const auth: Record<string, string> = this.apiKey
      ? { "x-umami-api-key": this.apiKey }
      : this.sessionCookie
        ? { Cookie: this.sessionCookie }
        : { Authorization: `Bearer ${await this.getToken()}` };
    const response = await this.fetchImpl(url, {
      method,
      headers: {
        ...auth,
        "Content-Type": "application/json",
        ...this.accessHeaders,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 401) {
      this.cachedToken = null;
      this.tokenExpiry = 0;
      throw new Error("Umami auth token expired");
    }

    if (!response.ok) {
      throw new Error(`Umami API error: ${response.status} ${response.statusText} (${path})`);
    }

    // A delete answers `ok` as plain text, so parsing it would throw on a call
    // that succeeded.
    if (method === "DELETE") return undefined as T;
    return (await response.json()) as T;
  }

  // ── Websites ──

  /** Every website this account can read, personal plus team, deduped by id. */
  async getWebsites(): Promise<UmamiWebsite[]> {
    if (this.cachedWebsites && Date.now() < this.websitesExpiry) return this.cachedWebsites;

    const personal = await this.request<UmamiWebsitesResponse>(
      `/api/websites?pageSize=${PAGE_SIZE}`,
    );

    let teamSites: UmamiWebsite[] = [];
    if (this.teamId) {
      const team = await this.request<UmamiWebsitesResponse>(
        `/api/teams/${this.teamId}/websites?pageSize=${PAGE_SIZE}`,
      );
      teamSites = team.data ?? [];
    }

    const seen = new Set<string>();
    const websites: UmamiWebsite[] = [];
    for (const site of [...(personal.data ?? []), ...teamSites]) {
      if (seen.has(site.id)) continue;
      seen.add(site.id);
      websites.push(site);
    }

    this.cachedWebsites = websites;
    this.websitesExpiry = Date.now() + WEBSITE_LIST_TTL_MS;
    return websites;
  }

  /**
   * Register a website, which is what a new marketing site needs before a tracker id exists to put in its layout.
   */

  /*
   * WHY a write on a reporting client: the same reason as `deleteWebsite` below. This is the one authenticated door to the host.
   */
  async createWebsite(input: {
    name: string;
    domain: string;
    teamId?: string;
  }): Promise<UmamiWebsite> {
    const site = await this.request<UmamiWebsite>("/api/websites", "POST", {
      name: input.name,
      domain: input.domain,
      ...(input.teamId ? { teamId: input.teamId } : {}),
    });
    this.cachedWebsites = null;
    this.websitesExpiry = 0;
    return site;
  }

  // ── Saved reports: the funnels and goals the dashboard draws ──

  async getReports(websiteId: string): Promise<UmamiReport[]> {
    const page = await this.request<{ data: UmamiReport[] } | UmamiReport[]>(
      `/api/reports?websiteId=${websiteId}&pageSize=200`,
    );
    return Array.isArray(page) ? page : page.data;
  }

  async createReport(input: Omit<UmamiReport, "id">): Promise<UmamiReport> {
    return this.request<UmamiReport>("/api/reports", "POST", input);
  }

  /**
   * Remove a website and everything tracked under it. There is no undo.
   */

  /*
   * WHY the one write on a reporting client: this is the only authenticated door to the host, and a second class would be a second place to carry the Cloudflare
   */

  /*
   * Access headers and the token cache. Reached from `pnpm umami websites:delete` and nowhere else.
   */
  async deleteWebsite(websiteId: string): Promise<void> {
    await this.request(`/api/websites/${websiteId}`, "DELETE");
    this.cachedWebsites = null;
    this.websitesExpiry = 0;
  }

  // ── Stats ──

  async getStats(websiteId: string, startAt: number, endAt: number): Promise<UmamiStatsResponse> {
    return this.request<UmamiStatsResponse>(
      `/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`,
    );
  }

  async getDateRange(websiteId: string): Promise<UmamiDateRangeResponse> {
    return this.request<UmamiDateRangeResponse>(`/api/websites/${websiteId}/daterange`);
  }

  // ── Active visitors ──

  async getActive(websiteId: string): Promise<number> {
    const data = await this.request<UmamiActiveResponse>(`/api/websites/${websiteId}/active`);
    return data.visitors ?? 0;
  }

  // ── Metrics ──

  async getMetrics(
    websiteId: string,
    type: UmamiMetricType,
    startAt: number,
    endAt: number,
    limit = 20,
  ): Promise<UmamiMetric[]> {
    return this.request<UmamiMetric[]>(
      `/api/websites/${websiteId}/metrics?startAt=${startAt}&endAt=${endAt}&type=${type}&limit=${limit}`,
    );
  }

  async getExpandedMetrics(
    websiteId: string,
    type: UmamiMetricType,
    startAt: number,
    endAt: number,
    limit = 20,
  ): Promise<UmamiExpandedMetric[]> {
    const raw = await this.request<UmamiExpandedMetricRaw[]>(
      `/api/websites/${websiteId}/metrics/expanded?startAt=${startAt}&endAt=${endAt}&type=${type}&limit=${limit}`,
    );
    return raw.map((entry) => ({
      name: entry.name,
      pageviews: Number(entry.pageviews),
      visitors: entry.visitors,
      visits: entry.visits,
      bounces: entry.bounces,
      totaltime: Number(entry.totaltime),
    }));
  }

  // ── Pageviews (time-series) ──

  async getPageviews(
    websiteId: string,
    startAt: number,
    endAt: number,
    unit = "day",
    timezone = "UTC",
  ): Promise<UmamiPageviewsResponse> {
    return this.request<UmamiPageviewsResponse>(
      `/api/websites/${websiteId}/pageviews?startAt=${startAt}&endAt=${endAt}&unit=${unit}` +
        `&timezone=${encodeURIComponent(timezone)}`,
    );
  }

  // ── Events ──

  async getEvents(
    websiteId: string,
    startAt: number,
    endAt: number,
    pageSize = 50,
  ): Promise<UmamiEventsResponse> {
    return this.request<UmamiEventsResponse>(
      `/api/websites/${websiteId}/events?startAt=${startAt}&endAt=${endAt}&pageSize=${pageSize}`,
    );
  }

  async getEventSeries(
    websiteId: string,
    startAt: number,
    endAt: number,
    unit = "day",
    timezone = "UTC",
  ): Promise<UmamiEventSeriesEntry[]> {
    return this.request<UmamiEventSeriesEntry[]>(
      `/api/websites/${websiteId}/events/series?startAt=${startAt}&endAt=${endAt}&unit=${unit}` +
        `&timezone=${encodeURIComponent(timezone)}`,
    );
  }

  // ── Event data ──

  /** Every (event, field) pair recorded in the window. The index for a rollup. */
  async getEventDataStats(
    websiteId: string,
    startAt: number,
    endAt: number,
  ): Promise<UmamiEventDataStat[]> {
    return this.request<UmamiEventDataStat[]>(
      `/api/websites/${websiteId}/event-data/stats?startAt=${startAt}&endAt=${endAt}`,
    );
  }

  /** The values one event field took in the window, e.g. every revenue amount. */
  async getEventDataValues(
    websiteId: string,
    startAt: number,
    endAt: number,
    event: string,
    field: string,
  ): Promise<UmamiEventDataValue[]> {
    // WHY URLSearchParams: an event name may carry spaces or a slash, which break a hand-built query string. WHY `propertyName` and not `property`: the self-hosted server validates

    // the query and answers `property` with a 400 naming `propertyName` as the missing field, so every call through this method failed until 24 Aug 2026. The docs say `property`.

    // The server is the authority.
    const params = new URLSearchParams({
      startAt: String(startAt),
      endAt: String(endAt),
      event,
      propertyName: field,
    });
    return this.request<UmamiEventDataValue[]>(
      `/api/websites/${websiteId}/event-data/values?${params.toString()}`,
    );
  }

  // ── Sessions ──

  async getSessions(
    websiteId: string,
    startAt: number,
    endAt: number,
    pageSize = 50,
  ): Promise<UmamiSessionsResponse> {
    return this.request<UmamiSessionsResponse>(
      `/api/websites/${websiteId}/sessions?startAt=${startAt}&endAt=${endAt}&pageSize=${pageSize}`,
    );
  }

  // ── Helpers ──

  /** Resolve a site identifier (UUID, exact domain, or name substring) to its id. */
  async resolveSiteId(siteArg: string): Promise<string> {
    if (/^[0-9a-f-]{36}$/i.test(siteArg)) return siteArg;

    const websites = await this.getWebsites();
    const lower = siteArg.toLowerCase();

    const byDomain = websites.find((w) => w.domain.toLowerCase() === lower);
    if (byDomain) return byDomain.id;

    const byPartial = websites.find(
      (w) => w.domain.toLowerCase().includes(lower) || w.name.toLowerCase().includes(lower),
    );
    if (byPartial) return byPartial.id;

    throw new Error(
      `No website found matching "${siteArg}". Run \`umami websites\` to see available sites.`,
    );
  }
}
