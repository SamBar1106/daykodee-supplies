export function parseCatalogResponse(status, body) {
  if (status === 401) return { status: "unauthorized" };
  if (status === 403) return { status: "forbidden" };
  if (status === 200 && body && Array.isArray(body.items)) {
    return { status: "ok", items: body.items };
  }
  return { status: "error", reason: "server" };
}

export function categoryOf(item) {
  const categories = Array.isArray(item?.categories) ? item.categories : [];
  const names = categories
    .map((category) => typeof category?.name === "string" ? category.name.trim() : "")
    .filter(Boolean);
  return names.length ? [...new Set(names)] : ["Other"];
}

export function categoriesFor(items) {
  // Keep API names in first-seen catalog order, with All always first.
  return [...new Set(["All", ...items.flatMap(categoryOf)])];
}

export function subtitleOf(item) {
  const text = String(item?.description || "").trim();
  if (!text) return "";
  const first = text.split("\n")[0].trim();
  if (first.length > 0 && first.length <= 96) return first;
  return "";
}

export function bodyOf(item) {
  const text = String(item?.description || "").trim();
  if (!text) return "";
  const lines = text.split("\n");
  const first = lines[0].trim();
  if (first.length > 0 && first.length <= 96 && lines.length > 1) {
    return lines.slice(1).join("\n").trim();
  }
  return text;
}

export function specRows(variant) {
  const choices = Array.isArray(variant?.choices) ? variant.choices : [];
  return choices
    .map((choice) => {
      if (!choice || typeof choice !== "object") return null;
      const name = choice.name || choice.option;
      const value = choice.value || choice.choice;
      if (!name || !value) return null;
      return { name: String(name), value: String(value) };
    })
    .filter(Boolean);
}

export function variantLabel(variant) {
  if (!variant) return "Standard";
  const specs = specRows(variant);
  if (specs.length) return specs.map((row) => row.value).join(" · ");
  const choices = Array.isArray(variant.choices) ? variant.choices : [];
  const text = choices
    .map((choice) => (typeof choice === "string" ? choice : ""))
    .filter(Boolean);
  if (text.length) return text.join(" · ");
  return variant.sku ? String(variant.sku) : "Standard";
}

export function optionSummary(variant) {
  const specs = specRows(variant);
  const pack = specs.find((row) => /pack|case|count/i.test(row.name));
  if (pack) return pack.value;
  if (specs.length === 1) return specs[0].value;
  return variantLabel(variant);
}

export function unitPrice(item, variant) {
  if (variant && variant.price !== null && variant.price !== undefined && variant.price !== "") {
    return variant.price;
  }
  return item?.price ?? null;
}

export function inStock(variant) {
  if (!variant || variant.inStock === null || variant.inStock === undefined) return null;
  return Boolean(variant.inStock);
}
