export interface Env {
  ASSETS: { fetch: typeof fetch };
}

// The site is public: the Worker only serves the built assets.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(request);
  },
};
