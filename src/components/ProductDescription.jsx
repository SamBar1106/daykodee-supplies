import { sanitizeDescription } from "../lib/description.js";

export function ProductDescription({ text, className = "" }) {
  const html = sanitizeDescription(text);
  if (!html) return null;
  return (
    <div
      className={`product-description ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
