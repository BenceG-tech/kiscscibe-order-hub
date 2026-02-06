/**
 * Simple markdown-like text to HTML converter.
 * Supports:
 *   **bold text** → <strong>bold text</strong>
 *   - list item   → <ul><li>...</li></ul>
 *   [text](url)   → <a href="url">text</a>
 *   Empty line     → new paragraph
 *
 * If the input already contains HTML tags, it is returned as-is
 * for backwards compatibility.
 */

const HTML_TAG_REGEX = /<\/?(?:p|div|ul|ol|li|table|thead|tbody|tr|td|th|h[1-6]|br|strong|em|a|span|code|pre|blockquote)\b/i;

export function isAlreadyHtml(text: string): boolean {
  return HTML_TAG_REGEX.test(text);
}

export function simpleMarkdownToHtml(text: string): string {
  if (!text || !text.trim()) return "";

  // If the content already contains HTML tags, return as-is
  if (isAlreadyHtml(text)) return text;

  const lines = text.split("\n");
  const htmlParts: string[] = [];
  let inList = false;
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      const content = paragraphLines.join("<br/>");
      htmlParts.push(`<p>${formatInline(content)}</p>`);
      paragraphLines = [];
    }
  };

  const flushList = () => {
    if (inList) {
      htmlParts.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line = paragraph break
    if (trimmed === "") {
      flushParagraph();
      flushList();
      continue;
    }

    // List item: "- text" or "• text"
    if (/^[-•]\s+/.test(trimmed)) {
      flushParagraph();
      if (!inList) {
        htmlParts.push("<ul>");
        inList = true;
      }
      const itemText = trimmed.replace(/^[-•]\s+/, "");
      htmlParts.push(`<li>${formatInline(itemText)}</li>`);
      continue;
    }

    // Regular line — if we were in a list, close it
    flushList();
    paragraphLines.push(trimmed);
  }

  // Flush remaining
  flushParagraph();
  flushList();

  return htmlParts.join("\n");
}

/** Format inline markers: **bold**, [text](url) */
function formatInline(text: string): string {
  let result = text;

  // Bold: **text**
  result = result.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Links: [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2">$1</a>'
  );

  return result;
}
