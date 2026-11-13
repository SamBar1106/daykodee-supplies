const env = import.meta.env ?? {};

// Public OAuth client for site 1ffbfadb-2877-4455-b124-c1535486eab0.
// The client itself is created in SUP-002. This app only reads the public id.
export const WIX_CLIENT_ID = String(env.VITE_WIX_CLIENT_ID || "").trim();

export const CATALOG_URL =
  "https://sam-erp-cloud-1.tail716e97.ts.net/daykodee-franchise/franchise-catalog";

// Wix Stores catalog app id, from the eCom current-cart docs.
export const STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";

export const TOKEN_STORAGE_KEY = "daykodee.memberTokens";
export const DEMO_FLAG_KEY = "daykodee.demo";
export const OAUTH_DATA_KEY = "daykodee.oauthData";
export const PKCE_KEY = "daykodee.pkce";
export const DEMO_CART_KEY = "daykodee.demoCart";

export const CATEGORIES = ["All", "Classroom", "Rest time", "Sanitation", "Outdoor"];
