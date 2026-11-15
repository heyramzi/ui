import { describe, expect, it } from "vite-plus/test";
import { getEmbedUrl } from "#src/testimonials/embed.js";

describe("getEmbedUrl", () => {
  it("turns a youtube watch link into its embed url", () => {
    expect(getEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe(
      "https://www.youtube.com/embed/abc123",
    );
  });

  it("rebuilds a youtube embed link from its id", () => {
    expect(getEmbedUrl("https://youtube.com/embed/abc123")).toBe(
      "https://www.youtube.com/embed/abc123",
    );
  });

  it("rebuilds a loom embed link from its id", () => {
    expect(getEmbedUrl("https://loom.com/embed/deadbeef?hide_owner=true")).toBe(
      "https://www.loom.com/embed/deadbeef",
    );
  });

  // The audit's payload: a non-special scheme followed by // gets a host, so a hostname check alone passes it.
  it.each([
    "javascript://youtube.com/embed/%0Aalert(document.domain)",
    "javascript://www.loom.com/embed/%0Aalert(document.domain)",
    "javascript://youtu.be/abc123%0Aalert(1)",
    "data://youtube.com/embed/abc123",
    "http://www.youtube.com/watch?v=abc123",
  ])("returns null for %s, which isn't https", (url) => {
    expect(getEmbedUrl(url)).toBeNull();
  });

  it.each([
    "https://www.youtube.com/watch?v=abc/../../evil",
    "https://www.youtube.com/embed/abc123:x",
    "https://vimeo.com/channels/staffpicks",
    "https://www.loom.com/share/a.b",
  ])("returns null for %s, whose id has characters an id never has", (url) => {
    expect(getEmbedUrl(url)).toBeNull();
  });

  it("turns a youtu.be short link into its embed url", () => {
    expect(getEmbedUrl("https://youtu.be/abc123")).toBe("https://www.youtube.com/embed/abc123");
  });

  it("turns a vimeo link into the player url", () => {
    expect(getEmbedUrl("https://vimeo.com/76979871")).toBe(
      "https://player.vimeo.com/video/76979871",
    );
  });

  it("turns a loom share link into its embed url", () => {
    expect(getEmbedUrl("https://www.loom.com/share/deadbeef?sid=1")).toBe(
      "https://www.loom.com/embed/deadbeef",
    );
  });

  it("returns null for a file url so the <video> path runs", () => {
    expect(getEmbedUrl("https://example.com/clip.mp4")).toBeNull();
  });

  it("returns null for a youtube link with no video id", () => {
    expect(getEmbedUrl("https://www.youtube.com/")).toBeNull();
  });

  it("returns null for text that is not a url", () => {
    expect(getEmbedUrl("not a url")).toBeNull();
  });
});
