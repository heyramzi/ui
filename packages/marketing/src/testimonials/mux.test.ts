import { describe, expect, it } from "vite-plus/test";
import { getMuxPlaybackId, getMuxPosterUrl } from "#src/testimonials/mux.js";

describe("getMuxPlaybackId", () => {
  it("unwraps the playback: sentinel the public API returns", () => {
    expect(getMuxPlaybackId("playback:5fHXDmrBtqs45iKI9mcSe02jYLAATWHwSo717GpAu00OQ")).toBe(
      "5fHXDmrBtqs45iKI9mcSe02jYLAATWHwSo717GpAu00OQ",
    );
  });

  it("reads the id back out of a stream.mux.com url", () => {
    expect(getMuxPlaybackId("https://stream.mux.com/abc123.m3u8")).toBe("abc123");
  });

  it("returns null for a plain file url so the <video> fallback still runs", () => {
    expect(getMuxPlaybackId("https://example.com/video.mp4")).toBeNull();
  });

  it("returns null for empty, null, and a bare sentinel with no id", () => {
    expect(getMuxPlaybackId(null)).toBeNull();
    expect(getMuxPlaybackId(undefined)).toBeNull();
    expect(getMuxPlaybackId("")).toBeNull();
    expect(getMuxPlaybackId("playback:")).toBeNull();
  });
});

describe("getMuxPosterUrl", () => {
  it("builds a sized thumbnail url", () => {
    expect(getMuxPosterUrl("abc123")).toBe(
      "https://image.mux.com/abc123/thumbnail.jpg?width=1280&fit_mode=preserve",
    );
  });

  it("returns null without a playback id", () => {
    expect(getMuxPosterUrl(null)).toBeNull();
  });
});
