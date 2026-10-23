// Dev-only stress page: the markup is gated on import.meta.env.DEV, so a production
// build renders nothing here. Never prerendered, because it reads the URL on the client.
export const prerender = false;
