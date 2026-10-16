import { describe, it, expect } from "vite-plus/test";
import { umamiScriptAttrs, umamiPreconnectAttrs } from "#src/analytics/svelte.js";

const DEFAULT_HOST = "https://your-umami-instance.com";

describe("umamiScriptAttrs", () => {
  it("returns src and data-website-id using the default host when no options are given", () => {
    const attrs = umamiScriptAttrs("my-website-id");
    expect(attrs).toEqual({
      src: `${DEFAULT_HOST}/script.js`,
      "data-website-id": "my-website-id",
    });
  });

  it("uses a custom hostUrl when provided", () => {
    const attrs = umamiScriptAttrs("my-website-id", {
      hostUrl: "https://custom.umami.io",
    });
    expect(attrs.src).toBe("https://custom.umami.io/script.js");
  });

  it("sets data-website-id from the first argument", () => {
    const attrs = umamiScriptAttrs("site-abc");
    expect(attrs["data-website-id"]).toBe("site-abc");
  });

  it("adds data-domains when domains are provided", () => {
    const attrs = umamiScriptAttrs("site-id", {
      domains: ["myapp.com", "www.myapp.com"],
    });
    expect(attrs["data-domains"]).toBe("myapp.com,www.myapp.com");
  });

  it("does not add data-domains when domains array is empty", () => {
    const attrs = umamiScriptAttrs("site-id", { domains: [] });
    expect(attrs).not.toHaveProperty("data-domains");
  });

  it("does not add data-domains when domains option is absent", () => {
    const attrs = umamiScriptAttrs("site-id");
    expect(attrs).not.toHaveProperty("data-domains");
  });

  it("adds data-before-send when beforeSend is provided", () => {
    const attrs = umamiScriptAttrs("site-id", { beforeSend: "umamiBeforeSend" });
    expect(attrs["data-before-send"]).toBe("umamiBeforeSend");
  });

  it("does not add data-before-send when beforeSend is absent", () => {
    const attrs = umamiScriptAttrs("site-id");
    expect(attrs).not.toHaveProperty("data-before-send");
  });

  it("adds data-do-not-track=true when doNotTrack is true", () => {
    const attrs = umamiScriptAttrs("site-id", { doNotTrack: true });
    expect(attrs["data-do-not-track"]).toBe("true");
  });

  it("does not add data-do-not-track when doNotTrack is false", () => {
    const attrs = umamiScriptAttrs("site-id", { doNotTrack: false });
    expect(attrs).not.toHaveProperty("data-do-not-track");
  });

  it("does not add data-do-not-track when doNotTrack is absent", () => {
    const attrs = umamiScriptAttrs("site-id");
    expect(attrs).not.toHaveProperty("data-do-not-track");
  });

  it("adds data-performance=true when performance is true", () => {
    const attrs = umamiScriptAttrs("site-id", { performance: true });
    expect(attrs["data-performance"]).toBe("true");
  });

  it("does not add data-performance when performance is false or absent", () => {
    expect(umamiScriptAttrs("site-id")).not.toHaveProperty("data-performance");
    expect(umamiScriptAttrs("site-id", { performance: false })).not.toHaveProperty(
      "data-performance",
    );
  });

  it("adds data-tag when tag is provided", () => {
    const attrs = umamiScriptAttrs("site-id", { tag: "v2" });
    expect(attrs["data-tag"]).toBe("v2");
  });

  it("all optional attributes can be combined", () => {
    const attrs = umamiScriptAttrs("site-id", {
      hostUrl: "https://u.example.com",
      domains: ["app.com"],
      beforeSend: "handler",
      doNotTrack: true,
      performance: true,
      tag: "release-42",
    });
    expect(attrs).toEqual({
      src: "https://u.example.com/script.js",
      "data-website-id": "site-id",
      "data-domains": "app.com",
      "data-before-send": "handler",
      "data-do-not-track": "true",
      "data-performance": "true",
      "data-tag": "release-42",
    });
  });
});

describe("umamiPreconnectAttrs", () => {
  it("returns preconnect and dns-prefetch objects with the default host", () => {
    const result = umamiPreconnectAttrs();
    expect(result.preconnect).toEqual({
      rel: "preconnect",
      href: DEFAULT_HOST,
    });
    expect(result.dnsPrefetch).toEqual({
      rel: "dns-prefetch",
      href: DEFAULT_HOST,
    });
  });

  it("uses the provided hostUrl", () => {
    const result = umamiPreconnectAttrs("https://analytics.example.com");
    expect(result.preconnect.href).toBe("https://analytics.example.com");
    expect(result.dnsPrefetch.href).toBe("https://analytics.example.com");
  });

  it("preconnect has rel=preconnect", () => {
    const result = umamiPreconnectAttrs();
    expect(result.preconnect.rel).toBe("preconnect");
  });

  it("dnsPrefetch has rel=dns-prefetch", () => {
    const result = umamiPreconnectAttrs();
    expect(result.dnsPrefetch.rel).toBe("dns-prefetch");
  });

  it("both entries point to the same host", () => {
    const customHost = "https://my-umami.io";
    const result = umamiPreconnectAttrs(customHost);
    expect(result.preconnect.href).toBe(result.dnsPrefetch.href);
  });
});
