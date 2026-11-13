import { DEMO_FLAG_KEY } from "./config.js";

export function isDemoMode() {
  const env = import.meta.env ?? {};
  if (env.VITE_DEMO === "1" || env.VITE_DEMO === "true") return true;
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("demo") === "1") {
    sessionStorage.setItem(DEMO_FLAG_KEY, "1");
    return true;
  }
  return sessionStorage.getItem(DEMO_FLAG_KEY) === "1";
}
