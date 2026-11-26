import { assetDocs, handleMcp } from "#src/mcp/server.js";

export interface Env {
  ASSETS: { fetch: typeof fetch };
}

// The site is public: the Worker serves the built assets, and `/mcp` answers agents from them.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/mcp" || url.pathname === "/mcp/")
      return handleMcp(request, assetDocs(env.ASSETS, url.origin));
    const response = await env.ASSETS.fetch(request);
    // WHY: a component's .md twin is for agents. Google crawled 47 of them and left each as
    // "crawled, not indexed", beside the HTML page that is the real result. noindex keeps them out
    // of the index on purpose, and the canonical link points at that page.
    if (url.pathname.endsWith(".md") && response.ok) {
      const twin = new Response(response.body, response);
      twin.headers.set("x-robots-tag", "noindex");
      twin.headers.append("link", `<${url.origin}${url.pathname.slice(0, -3)}>; rel="canonical"`);
      return twin;
    }
    return response;
  },
};
