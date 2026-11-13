import { CATALOG_URL } from "./config.js";
import { parseCatalogResponse } from "./catalog.js";

export async function fetchFranchiseCatalog(accessToken) {
  try {
    const response = await fetch(CATALOG_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return parseCatalogResponse(response.status, body);
  } catch {
    return { status: "error", reason: "network" };
  }
}
