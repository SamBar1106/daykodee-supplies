# Daykodee Supplies: KANBAN

Policy 05: ED keeps this board current and routes each ticket to the right worker. Samuel approves merges, spending, sending, posting, filing and schema changes.
Last updated: Nov 13, 2026

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

- [ ] SUP-001: Franchisee portal built from the Stitch mockups (React + Vite). Routes, Wix Members PKCE, franchise catalog statuses, Wix eCom checkout, and `?demo=1` sample catalog are in the branch. `npm run build` writes `dist/` plus `404.html`. Not merged. No `CNAME`, no custom domain, `noindex` stays on. Preview hosting is separate. Remaining before a live catalog on the Pages URL: SUP-002 (OAuth client ID) and a CORS allowlist entry for `https://sambar1106.github.io`.

## In Progress

- (none)

## Waiting on Samuel

- [ ] SUP-004: Preview review by Samuel. Local demo is ready (`npm run dev`, then `?demo=1`). The GitHub Pages project URL is still a separate deploy. Do not go live.
- [ ] SUP-005: Go-live of https://supplies.daykodee.com/ (Pages custom domain, `CNAME` file, Enforce HTTPS after the certificate). **Blocked on Samuel’s explicit OK.** Do not publish or make the site live without that OK.

## Done

- [x] Repo seed: public GitHub `SamBar1106/daykodee-supplies` with README, this board, BUILD-BRIEF.md, logo, and Stitch mockups. Nov 12, 2026, 9:03 PM CT. No app code, no Pages custom domain, no secrets.
