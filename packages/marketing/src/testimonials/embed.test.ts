import { describe, expect, it } from "vite-plus/test";
import { getEmbedUrl } from "#src/testimonials/embed.js";

describe("getEmbedUrl", () => {
  it("turns a youtube watch link into its embed url", () => {
    expect(getEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe(
      "https://www.youtube.com/embed/abc123",
    );
  });

  it("keeps a youtube embed link as it is", () => {
    expect(getEmbedUrl("https://youtube.com/embed/abc123")).toBe(
      "https://youtube.com/embed/abc123",
    );
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
