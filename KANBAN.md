# Daykodee Supplies: KANBAN

Policy 05: ED keeps this board current and routes each ticket to the right worker. Samuel approves merges, spending, sending, posting, filing and schema changes.
Last updated: Nov 16, 2026, 6:25 PM CT

Public GitHub: https://github.com/SamBar1106/daykodee-supplies
This copy must stay public (GitHub Pages, free plan). **No secrets ever** go in the repo.

Policy also wants a private Gitea source of truth at `https://desktop-2p168ve.tail716e97.ts.net:3443/samuelbarrios/daykodee-supplies`, push-mirrored to this GitHub repo, the same way as `takeod-site`. **Gitea was unreachable from the box on Nov 12, 2026, 9:03 PM CT:** DNS resolved (`desktop-2p168ve.tail716e97.ts.net` → `198.18.0.1`), but the TLS handshake to port 3443 failed (`error:0A000126:SSL routines::unexpected eof while reading`). No Gitea repo was created. Revisit when Gitea is reachable; until then this GitHub repo is the working copy.

## Source docs

- Plan v3: Daykodee Franchise Portal on supplies.daykodee.com (hidden catalog + checkout lock + separate site)
- Stitch project: https://stitch.withgoogle.com/projects/12072481528278694360 — design system **Daykodee Supplies White**; mockups in `design/stitch/`
- Build brief: [BUILD-BRIEF.md](./BUILD-BRIEF.md)
- Samuel approval (voice call, Nov 12, 2026, ~8:57 PM CT): build supplies.daykodee.com from the Stitch mockups; preview for Samuel before anything goes live; DNS CNAME for the supplies subdomain is also approved, but the live site is not.

## Backlog

- (none)

## Planned

- [ ] SUP-002: Create a dedicated Wix Headless OAuth client for supplies (PKCE, site `1ffbfadb-2877-4455-b124-c1535486eab0`) with redirect `https://supplies.daykodee.com/callback` and preview `http://localhost:5173/callback`. Put the public client ID in `VITE_WIX_CLIENT_ID`. Add that client ID to the franchise API allowlist (`WIX_PORTAL_CLIENT_IDS` on sam-erp-cloud-1).
- [ ] SUP-003: GoDaddy DNS `CNAME` `supplies` → `sambar1106.github.io`. Do not change existing `daykodee.com` apex A records or the `www` CNAME. Do not add a `CNAME` file or enable the GitHub Pages custom domain until SUP-005. Samuel approved this DNS change on Nov 12, 2026, ~8:57 PM CT; the record has not been created yet.

## In review

- [x] SUP-001: Franchisee portal built from the Stitch mockups (React + Vite). Merged to main via GitHub PR #1 on Nov 12, 2026, 10:52 PM ET (`51e16da`). Routes, Wix Members PKCE, franchise catalog statuses, Wix eCom checkout, and `?demo=1` sample catalog are included. `npm run build` writes `dist/` plus `404.html`. No `CNAME` file in the repo. Live custom-domain go-live still waits on SUP-005.

## In Progress

- (none)

## Waiting on Samuel

- [ ] SUP-004: Preview review by Samuel. Local demo is ready (`npm run dev`, then `?demo=1`). The GitHub Pages project URL is still a separate deploy. Do not go live.
- [ ] SUP-005: Go-live of https://supplies.daykodee.com/ (Pages custom domain, `CNAME` file, Enforce HTTPS after the certificate). **Blocked on Samuel’s explicit OK.** Do not publish or make the site live without that OK.

## Done
- [x] SUP-008: Email/password sign-in refreshes session/access after the first-attempt PKCE callback, so a correct login lands in the catalog (or pending) on the first try. Google sign-in unchanged. Merged Nov 15, 2026, 7:31 AM CT via GitHub PR #4 (`f88c676`), Samuel OK. Deployed to gh-pages `f284561`. `npm test` 16 passed.

- [x] SUP-006: Product descriptions sanitized with DOMPurify and rendered as formatted text on catalog cards and the product page (no raw HTML tags). Merged Nov 16, 2026, 6:18 PM CT via GitHub PR #2 (`49a3f11`); Samuel OK Nov 16, 2026, 6:01 PM CT. Deployed to gh-pages `73671ff` (production build from `49a3f11`); live check on supplies.daykodee.com passed. `npm test` 21 passed, 0 failed.

- [x] SUP-007: Catalog tabs are built from Wix category ids/names returned by the franchise-catalog API, with an Other fallback. Merged to main via GitHub PR #3 on Nov 14, 2026 (`1a38c5e`). Live site tabs confirmed after the franchise-api deploy.
- [x] Repo seed: public GitHub `SamBar1106/daykodee-supplies` with README, this board, BUILD-BRIEF.md, logo, and Stitch mockups. Nov 12, 2026, 9:03 PM CT. No app code, no Pages custom domain, no secrets.
