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
    return env.ASSETS.fetch(request);
  },
};
