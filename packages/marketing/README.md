# @heyramzi/marketing

Marketing utilities for the vibe-kit ecosystem: analytics, error reporting, brand and testimonial surfaces, and a generic HTML→image rendering pipeline.

## Features

- **Umami analytics**: the browser script helper, a server tracker, a one-call unified tracker, the wire protocol for edge runtimes, and a reporting API client to read traffic back.
- **Sentry**: a protocol split for runtimes that cannot load the SDK, and an SDK wrapper.
- **Image generation (`imagegen`)**: Generic satori-based HTML to SVG/PNG/AVIF pipeline. Consumers bring their own templates.
- **Brand and testimonials**: brand tokens and testimonial types, server loaders and Svelte surfaces.

## Installation

```bash
pnpm add @heyramzi/marketing
```

## Usage

### Analytics

The analytics module provides wrappers for Umami tracking across different environments.

#### Server-side (Node.js/SvelteKit)

```typescript
import { initServer, trackServer } from '@heyramzi/marketing/analytics/server';

initServer({
  hostUrl: 'https://umami.example.com',
  websiteId: process.env.UMAMI_WEBSITE_ID,
  hostname: 'example.com',
});
// Resolves true once Umami recorded it. On a Worker, await it or pass it to waitUntil.
await trackServer('signup', { plan: 'pro' }, { url: '/signup', id: user.id });
```

#### Script tag and browser tracking

```svelte
<script>
  import { umamiScriptAttrs } from '@heyramzi/marketing/analytics/svelte';
  import { initAnalytics, track } from '@heyramzi/marketing/analytics/unified';
</script>

<svelte:head>
  <script defer {...umamiScriptAttrs("your-id")}></script>
</svelte:head>
```

`analytics/unified` is the browser tracker: `initAnalytics` once (it returns a cleanup function), then `track`, `trackError`, `trackRevenue` and `setProfileId`.

#### Reading traffic back out

`analytics/unified` and `analytics/server` write events. `analytics/umami/reporting` reads them: websites, stats, metrics, time-series, sessions and live visitors. It is the one client for every runtime, so a Cloudflare Worker, a Node server and a CLI all read the same numbers the same way. Transport is the only thing injected.

```typescript
import { UmamiReportingClient } from "@heyramzi/marketing/analytics/umami/reporting";

const client = new UmamiReportingClient({
  apiUrl: process.env.UMAMI_API_URL,
  username: process.env.UMAMI_USERNAME,
  password: process.env.UMAMI_PASSWORD,
  // Required when the Umami host sits behind Cloudflare Access, which answers
  // an unauthenticated API call with an HTML login page instead of JSON.
  accessClientId: process.env.CF_ACCESS_CLIENT_ID,
  accessClientSecret: process.env.CF_ACCESS_CLIENT_SECRET,
});
```

Note that the server returns the current window flat and the preceding window under `comparison`, not `{ value, prev }` per metric.

### Image Generation

Generic HTML→image pipeline built on satori + sharp. Supports SVG, PNG, and AVIF. Fonts can be loaded from `.ttf`, `.otf`, or `.woff2` files (woff2 is decoded transparently).

```typescript
import { html } from 'satori-html';
import { loadFonts, renderImage } from '@heyramzi/marketing/imagegen';

const fonts = await loadFonts([
  { name: 'Manrope', path: '/path/to/manrope-700.woff2', weight: 700 },
]);

const markup = html`<div style="display:flex;">Hello</div>`;

const png = await renderImage(markup, {
  fonts,
  size: { width: 1200, height: 630 },
  format: 'png',
});
```

Templates, handlers, and query-param plumbing belong in the consuming app. This package intentionally ships only the rendering primitives.

## Development

- `pnpm test`: Run vitest suites.
