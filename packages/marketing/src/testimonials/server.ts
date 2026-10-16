import type {
  PublicCollectionResponse,
  PublicTestimonial,
  CollectionStat,
} from "#src/testimonials/types.js";

export const DEFAULT_TESTIMONIALS_BASE_URL = "https://app.upsys-consulting.com";

export type FetchPublicTestimonialsOptions = {
  baseUrl?: string;
  locale?: "en" | "fr";
  layout?: string;
  fetchImpl?: typeof fetch;
};

export async function fetchPublicTestimonialCollection(
  token: string,
  opts: FetchPublicTestimonialsOptions = {},
): Promise<PublicCollectionResponse | null> {
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const baseUrl = (opts.baseUrl ?? DEFAULT_TESTIMONIALS_BASE_URL).replace(/\/$/, "");
  const params = new URLSearchParams();
  if (opts.locale) params.set("locale", opts.locale);
  if (opts.layout) params.set("layout", opts.layout);
  const query = params.toString();
  const url = `${baseUrl}/api/testimonials/public/${encodeURIComponent(token)}${query ? `?${query}` : ""}`;

  const response = await fetchImpl(url);
  if (!response.ok) return null;
  return (await response.json()) as PublicCollectionResponse;
}

export async function fetchPublicTestimonials(
  token: string,
  opts: FetchPublicTestimonialsOptions = {},
): Promise<PublicTestimonial[]> {
  const data = await fetchPublicTestimonialCollection(token, opts);
  return data?.testimonials ?? [];
}

export async function fetchPublicTestimonialStats(
  token: string,
  opts: FetchPublicTestimonialsOptions = {},
): Promise<CollectionStat[]> {
  const data = await fetchPublicTestimonialCollection(token, opts);
  return data?.collection.stats ?? [];
}
