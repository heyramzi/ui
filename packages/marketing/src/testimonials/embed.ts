/**
 * WHY: a testimonial's `videoUrl` is a pasted link, so YouTube, Vimeo and Loom arrive as watch or share pages that refuse to load inside an iframe.
 */

/*
 * Returns the iframe-safe url for a known host, and null for anything else, so the caller falls back to a `<video>`.
 */
export function getEmbedUrl(videoUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(videoUrl);
  } catch {
    return null;
  }

  const { hostname, pathname } = parsed;

  if (hostname === "www.youtube.com" || hostname === "youtube.com") {
    if (pathname.startsWith("/embed/")) return videoUrl;
    const videoId = parsed.searchParams.get("v");
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (hostname === "youtu.be") {
    const videoId = pathname.slice(1);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (hostname === "vimeo.com" || hostname === "www.vimeo.com") {
    const videoId = pathname.slice(1);
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
  }

  if (hostname === "www.loom.com" || hostname === "loom.com") {
    if (pathname.startsWith("/embed/")) return videoUrl;
    const shareId = pathname.match(/\/share\/([^?]+)/)?.[1];
    return shareId ? `https://www.loom.com/embed/${shareId}` : null;
  }

  return null;
}
