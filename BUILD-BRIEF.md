# BUILD-BRIEF.md — Daykodee Supplies

Hand this file to the coding agent. **Build the app from this brief and the mockups in `design/stitch/`. Do not invent a second brand or link out to the public store.**

Last updated: Nov 12, 2026, 9:03 PM CT.

## 1. What to build

A **React + Vite** static site for GitHub Pages. This is the franchisee portal at `https://supplies.daykodee.com/` (not live yet).

- Own menu and routes. **No links** to [daykodee.com](https://daykodee.com/) (shop, about, cart, or anything else), and none from the public store back here.
- White base, Daykodee style:
  - Royal blue `#0A3A9E`
  - Gold `#D4A017`
  - Body text `#1A1D23`, secondary text `#4A5160`
  - Page and cards `#FFFFFF`; optional section tint `#F7F8FA` only if needed
  - Logo: `public/daykodee-logo-trim.png` (copy from this repo; do not hotlink elsewhere)
  - Type: Plus Jakarta Sans
- Persistent, unmistakable **“Franchise owners only”** notice (header or gold/blue banner) on **every** screen, including login.
- Match the seven Stitch screens in `design/stitch/` (see that folder’s README for the file list). Sample products in the mockups are labeled placeholders.
- Header menu is only: Catalog, Cart, Account. No Shop / About / public-store items.
- `noindex` until launch (`<meta name="robots" content="noindex, nofollow">` on all pages).
- **Do not add a `CNAME` file.** Custom domain and go-live are blocked on Samuel (SUP-005).

## 2. Base path and preview

- Local dev: Vite default, `http://localhost:5173/`.
- GitHub Pages **project** preview (after a Pages workflow exists): `https://sambar1106.github.io/daykodee-supplies/`.
- Configure Vite `base` so both work: use `base: process.env.GITHUB_PAGES === 'true' ? '/daykodee-supplies/' : '/'` (or equivalent), and React Router’s `basename` to match.
- Copy `index.html` to `404.html` in the build output so deep links work on GitHub Pages (same pattern as `takeod-site`).
- Production origin later: `https://supplies.daykodee.com/` (root, no repo subpath). Not enabled yet.

## 3. Routes

| Route | Who | What |
|---|---|---|
| `/login` | Visitors and returning franchisees | Sign-in: email + password, “Continue with Google,” franchise-only notice. Match `01-desktop-sign-in.png` / `06-mobile-sign-in.png`. |
| `/callback` | OAuth return | Finish PKCE / redirect. No marketing UI. |
| `/pending` | Signed in but not approved, or missing the Franchisees label | Waiting / not-a-franchisee copy. No product list. Match `02-desktop-pending-approval.png`. |
| `/` | Approved, labeled franchisees | Catalog grid from the franchise API only. Unauthenticated visits redirect to `/login`. Match `03-desktop-catalog.png` / `07-mobile-catalog.png`. |
| `/product/:productId` | Same | Product detail, add to cart. API 401 → `/login`. API 403 → `/pending`. Match `04-desktop-product-detail.png`. |
| `/cart` | Same | Cart / pre-checkout summary, then Wix-hosted checkout. Match `05-desktop-cart.png`. |
| `/thank-you` | After Wix checkout | Order confirmation. Set Wix checkout `postFlowUrl` and `thankYouPageUrl` to `https://supplies.daykodee.com/thank-you` when live; for local/preview use the matching origin. |

## 4. Login (Wix Headless Members, PKCE)

- Use the **Wix Headless SDK** member login (email/password and Google). OAuth **PKCE**. Do not build a custom Google Cloud login app.
- Wix site ID: `1ffbfadb-2877-4455-b124-c1535486eab0`.
- Public client ID comes from env: **`VITE_WIX_CLIENT_ID`** (see `.env.example`). A **dedicated supplies OAuth client** still has to be created (SUP-002). Until it exists, the app should read the placeholder and fail clearly if it is empty.
- Redirect URIs that client must allow (exact match):
  - Preview / local: `http://localhost:5173/callback`
  - Production (after go-live): `https://supplies.daykodee.com/callback`
- Do not reuse the public store’s OAuth client in a way that would send daykodee.com logins to supplies.
- Signup stays “only people I manually approve.” Approval and the Franchisees label are done in Wix, not in this app.

## 5. Franchise catalog API

After login, call:

```
GET https://sam-erp-cloud-1.tail716e97.ts.net/daykodee-franchise/franchise-catalog
Authorization: Bearer <member access token>
```

CORS on the server already allows `https://supplies.daykodee.com` and `http://localhost:5173`. A GitHub Pages preview origin (`https://sambar1106.github.io`) is **not** on that allowlist yet; document it if preview catalog calls fail, and do not weaken CORS from this repo.

Health check (no auth): `GET https://sam-erp-cloud-1.tail716e97.ts.net/daykodee-franchise/health` → `{ "ok": true }`.

### Status handling

| HTTP | Body | UI |
|---|---|---|
| 401 | `{ "error": "unauthorized" }` | Send the user to sign in (`/login`). Happens when there is no token, the token is invalid, it is not a member token, it is for the wrong site, or the token’s OAuth client is not on the API allowlist (SUP-002). |
| 403 | `{ "error": "forbidden" }` | Pending-approval / not-a-franchisee message (`/pending`). Happens when the member is not `APPROVED`, has no contact, or is missing the Franchisees label. |
| 200 | `{ "items": [ ... ] }` | Render the product grid from `items`. |
| 500 | `{ "error": "server_error" }` | Generic error; do not show raw traces. |

Do **not** query the public Wix catalog from this app. Hidden products are only available through this API.

### 200 response shape

Source: `mapProduct` in the franchise API (`daykodee-franchise-impl/src/app.js` + `src/wix.js`). The handler returns `{ items }`, where each item is:

```json
{
  "id": "string | null",
  "name": "string | null",
  "slug": "string | null",
  "description": "string | null",
  "currency": "string | null",
  "price": "number | string | null",
  "compareAtPrice": "number | string | null",
  "mainImage": "string | object | null",
  "images": ["string | object"],
  "variants": [
    {
      "id": "string | null",
      "sku": "string | null",
      "price": "number | string | null",
      "choices": ["..."],
      "inStock": "boolean | null"
    }
  ]
}
```

`price` / `compareAtPrice` are taken from Wix amount fields. `mainImage` may be a URL string or a Wix image object (`p.media.main.image` preferred, else `p.media.main.url`). `images` is the remaining media, same rule. Guard against `null` fields.

The server may also return `401`/`403`/`500` as `{ "error": "<code>" }` only — no extra message text.

## 6. Product detail, cart, and checkout

- Product detail and add-to-cart / checkout use **Wix eCom** (current cart → Wix-hosted checkout).
- The Daykodee Franchise Portal app already installed on the Daykodee Wix site enforces the checkout lock: if a franchise-only item is in the cart and the buyer is not a labeled franchisee, checkout is blocked. Trust that lock; still never show the hidden catalog to anyone who did not get a 200 from the franchise API.
- Thank-you returns to this site’s `/thank-you`, not to daykodee.com.

## 7. Constraints (do not violate)

- No secrets, Wix client secrets, API keys, tokens, or client personal data in the repo or in GitHub Actions *secrets* that would be echoed into the public tree. The only frontend credential is the **public** `VITE_WIX_CLIENT_ID` (Actions *variable*, like takeod-site).
- Do not enable GitHub Pages custom domain, do not add `public/CNAME`, do not publish/go live.
- Do not buy plans, send messages, or change DNS from the app work (DNS is SUP-003, separately).
- Do not modify the public daykodee.com site or the `takeod-site` repo as part of this build.
- Keep a `KANBAN.md` ticket current when you start or finish work (Policy 05).

## 8. Suggested implementation order

1. Vite + React + React Router scaffold, white layout, logo, banner, menu, `noindex`, base-path config, `404.html` copy.
2. Static pages matching the seven mockups with placeholder data.
3. Wix Members PKCE login + `/callback`, gated routes.
4. Catalog fetch against the API, 401/403/200 handling, product grid and detail from `items`.
5. Cart + Wix eCom checkout + `/thank-you`.
6. Preview on `sambar1106.github.io/daykodee-supplies/` for SUP-004 (Samuel’s review). Do not go live.
