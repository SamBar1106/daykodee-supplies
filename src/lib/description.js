import DOMPurify from "dompurify";

// A purifier created with jsdom can be supplied by the Node tests.
export function sanitizeDescription(description, purifier = DOMPurify) {
  return purifier.sanitize(String(description || "").trim(), {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "b", "i", "ul", "ol", "li", "a"],
    ALLOWED_ATTR: ["href"],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
}

// This only selects copy behavior; sanitizeDescription is the security boundary.
export function hasDescriptionHtml(text) {
  return /<\/?[a-z][^>]*>/i.test(text);
}
