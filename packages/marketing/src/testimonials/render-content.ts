// Safe converter for testimonial content stored with **bold** markdown.
// Escapes HTML, then replaces **...** with <strong>...</strong>.
// Output is intended for {@html ...} or dangerouslySetInnerHTML.

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}

export function renderTestimonialContent(content: string | null | undefined): string {
  if (!content) return "";
  const escaped = escapeHtml(content);
  return escaped.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
}
