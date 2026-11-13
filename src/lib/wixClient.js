import { createClient, OAuthStrategy } from "@wix/sdk";
import { members } from "@wix/members";
import { currentCart } from "@wix/ecom";
import { redirects } from "@wix/redirects";
import { TOKEN_STORAGE_KEY, WIX_CLIENT_ID } from "./config.js";

let client;

export function readStoredTokens() {
  if (typeof localStorage === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

export function persistTokens(tokens) {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearStoredTokens() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  client = undefined;
}

export function wixConfigured() {
  return Boolean(WIX_CLIENT_ID);
}

export function getWixClient() {
  if (!WIX_CLIENT_ID) return null;
  if (client) return client;
  const tokens = readStoredTokens();
  client = createClient({
    modules: { members, currentCart, redirects },
    auth: OAuthStrategy({
      clientId: WIX_CLIENT_ID,
      tokens: tokens || undefined,
    }),
  });
  return client;
}

export async function ensureVisitorTokens(wix) {
  const existing = wix.auth.getTokens();
  if (existing?.accessToken?.value) return existing;
  const tokens = await wix.auth.generateVisitorTokens();
  wix.auth.setTokens(tokens);
  return tokens;
}

export function applyTokens(wix, tokens) {
  wix.auth.setTokens(tokens);
  persistTokens(tokens);
}

export async function memberAccessToken(wix) {
  const tokens = wix.auth.getTokens();
  const expiresAt = tokens?.accessToken?.expiresAt || 0;
  const now = Math.floor(Date.now() / 1000);
  if (tokens?.accessToken?.value && expiresAt - 30 > now) {
    return tokens.accessToken.value;
  }
  if (tokens?.refreshToken?.value) {
    const renewed = await wix.auth.renewToken(tokens.refreshToken);
    applyTokens(wix, renewed);
    return renewed.accessToken?.value || null;
  }
  return tokens?.accessToken?.value || null;
}

export function memberDisplayName(member) {
  if (!member) return "Account";
  const nickname = member.profile?.nickname;
  if (nickname) return nickname;
  const contact = member.contact || {};
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim();
  return name || member.loginEmail || "Account";
}

export function memberInitials(member) {
  const label = memberDisplayName(member);
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "FA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export async function loadCurrentMember(wix) {
  const result = await wix.members.getCurrentMember({ fieldsets: ["FULL"] });
  return result?.member ?? result ?? null;
}
