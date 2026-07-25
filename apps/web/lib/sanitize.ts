import sanitizeHtml from "sanitize-html";

/**
 * Supplier product descriptions are third-party HTML from Alibaba — never
 * trusted. This strips scripts/handlers/iframes and keeps only presentational
 * markup, so the PDP can render formatting without an XSS vector. Runs
 * server-side (Server Component), so the sanitized string is all the client sees.
 */
export function sanitizeDescription(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "b", "strong", "i", "em", "u", "span", "div",
      "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
      "table", "thead", "tbody", "tr", "td", "th", "img",
    ],
    allowedAttributes: {
      img: ["src", "alt", "width", "height"],
      "*": ["style"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^left$/, /^right$/, /^center$/],
        "font-weight": [/^bold$/, /^\d{3}$/],
        "padding": [/^[\d.]+(px|em|rem|%)?( [\d.]+(px|em|rem|%)?){0,3}$/],
        "margin": [/^[\d.]+(px|em|rem|%)?( [\d.]+(px|em|rem|%)?){0,3}$/],
      },
    },
    // Only allow http(s) image sources; drop javascript:/data: and other schemes.
    allowedSchemesByTag: { img: ["http", "https"] },
    transformTags: {
      // Neutralize any lingering anchor into plain text-bearing span.
      a: "span",
    },
  });
}
