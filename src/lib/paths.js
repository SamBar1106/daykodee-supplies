function baseUrl() {
  const env = import.meta.env ?? {};
  return env.BASE_URL || "/";
}

export function routerBasename() {
  const base = baseUrl();
  if (base === "/") return "/";
  return base.replace(/\/$/, "");
}

export function publicAsset(file) {
  return `${baseUrl()}${String(file).replace(/^\//, "")}`;
}

export function appUrl(path) {
  const normalized = String(path || "").replace(/^\//, "");
  return new URL(normalized, window.location.origin + baseUrl()).toString();
}
