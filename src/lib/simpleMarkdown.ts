/**
 * Simple markdown-like text to HTML converter with safety sanitization.
 * Supports:
 *   **bold text** → <strong>bold text</strong>
 *   - list item   → <ul><li>...</li></ul>
 *   [text](url)   → <a href="url">text</a>
 *   Empty line     → new paragraph
 *
 * Output is sanitized: <script>, on*= handlers, and javascript:/data: URLs
 * are stripped to prevent stored XSS via admin-controlled content.
 */

const HTML_TAG_REGEX = /<\/?(?:p|div|ul|ol|li|table|thead|tbody|tr|td|th|h[1-6]|br|strong|em|a|span|code|pre|blockquote)\b/i;

export function isAlreadyHtml(text: string): boolean {
  return HTML_TAG_REGEX.test(text);
}

/** Remove <script> tags, event handlers and dangerous URL schemes. */
function sanitizeHtml(html: string): string {
  let out = html;
  // Strip <script>...</script> blocks (incl. malformed)
  out = out.replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "");
  out = out.replace(/<\s*script\b[^>]*>/gi, "");
  // Strip <style> and <iframe>/<object>/<embed>
  out = out.replace(/<\s*(style|iframe|object|embed|link|meta)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  out = out.replace(/<\s*(iframe|object|embed|link|meta)\b[^>]*>/gi, "");
  // Strip inline event handlers (onclick=, onerror=, ...)
  out = out.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "");
  out = out.replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "");
  // Neutralize dangerous URL schemes inside href/src
  out = out.replace(/(href|src)\s*=\s*"(\s*(?:javascript|data|vbscript):[^"]*)"/gi, '$1="#"');
  out = out.replace(/(href|src)\s*=\s*'(\s*(?:javascript|data|vbscript):[^']*)'/gi, "$1='#'");
  return out;
}

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  if (!trimmed) return false;
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return false;
  return true;
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function simpleMarkdownToHtml(text: string): string {
  if (!text || !text.trim()) return "";

  // If the content already contains HTML tags, sanitize and return
  if (isAlreadyHtml(text)) return sanitizeHtml(text);

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

    if (trimmed === "") {
      flushParagraph();
      flushList();
      continue;
    }

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

    flushList();
    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();

  return sanitizeHtml(htmlParts.join("\n"));
}

function formatInline(text: string): string {
  let result = text;

  // Bold: **text**
  result = result.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Links: [text](url) — validate URL scheme
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, label: string, url: string) => {
      const safeUrl = isSafeUrl(url) ? escapeAttr(url) : "#";
      return `<a href="${safeUrl}" rel="noopener noreferrer">${label}</a>`;
    },
  );

  return result;
}
