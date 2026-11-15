/**
 * WHY: a testimonial's `videoUrl` is a pasted link, so YouTube, Vimeo and Loom arrive as watch or share pages that refuse to load inside an iframe.
 */

// WHY: an id goes into a path we build, so it may hold only id characters, never a slash, dot or colon.
const VIDEO_ID = /^[A-Za-z0-9_-]+$/;
const VIMEO_ID = /^\d+$/;

/*
 * Returns the iframe-safe url for a known host, and null for anything else, so the caller falls back to a `<video>`.
 * The url is rebuilt from the id, never passed through: `javascript://youtube.com/embed/...` parses with
 * youtube.com as its host, and an iframe given it runs script in the page.
 */
export function getEmbedUrl(videoUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(videoUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;

  const { hostname, pathname } = parsed;
  const segments = pathname.split("/").filter(Boolean);
  const id = (value: string | null | undefined, shape = VIDEO_ID) =>
    value && shape.test(value) ? value : null;

  if (hostname === "www.youtube.com" || hostname === "youtube.com") {
    const videoId = id(segments[0] === "embed" ? segments[1] : parsed.searchParams.get("v"));
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (hostname === "youtu.be") {
    const videoId = id(segments[0]);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (hostname === "vimeo.com" || hostname === "www.vimeo.com") {
    const videoId = id(segments[0], VIMEO_ID);
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
  }

  if (hostname === "www.loom.com" || hostname === "loom.com") {
    const shareId = segments[0] === "embed" || segments[0] === "share" ? id(segments[1]) : null;
    return shareId ? `https://www.loom.com/embed/${shareId}` : null;
  }

  return null;
}
