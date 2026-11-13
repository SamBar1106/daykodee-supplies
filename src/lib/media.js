export function imageUrl(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value !== "object") return null;
  if (typeof value.url === "string" && value.url.trim()) return value.url.trim();
  if (typeof value.src === "string" && value.src.trim()) return value.src.trim();
  if (typeof value.image === "string" && value.image.trim()) return value.image.trim();
  if (value.image && typeof value.image === "object") return imageUrl(value.image);
  return null;
}

export function productImages(item) {
  const urls = [];
  const main = imageUrl(item?.mainImage);
  if (main) urls.push(main);
  const extras = Array.isArray(item?.images) ? item.images : [];
  for (const image of extras) {
    const url = imageUrl(image);
    if (url && !urls.includes(url)) urls.push(url);
  }
  return urls;
}
