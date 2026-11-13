# Daykodee Supplies

Franchisee-facing portal for Daykodee, to be hosted at **https://supplies.daykodee.com/**.

This is a **completely separate site** from the public store. Approved Family Affair franchise owners sign in with Wix Members (email/password or Google). The site sends their member token to the franchise catalog API on the existing DigitalOcean server (`sam-erp-cloud-1`). That server checks that the member is approved and has the Franchisees label, then returns the hidden franchise products from the Daykodee Wix store. Checkout stays on Wix; the installed checkout lock blocks anyone who is not a labeled franchisee.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173/login. Add `?demo=1` (or set `VITE_DEMO=1`) to review the catalog, product, and cart with sample data and no Wix client. Copy `.env.example` to `.env` and set `VITE_WIX_CLIENT_ID` when the supplies OAuth client exists (SUP-002).

```bash
npm test
npm run build
```

`npm run build` writes `dist/` for a root host and copies `index.html` to `dist/404.html`. For the GitHub Pages project URL, build with `GITHUB_PAGES=true` so assets use the `/daykodee-supplies/` base. Do not add a `CNAME` file.

## Docs for the coding agent

- [BUILD-BRIEF.md](./BUILD-BRIEF.md) — stack, routes, design rules, login, API contract, and constraints
- [KANBAN.md](./KANBAN.md) — project board (Policy 05)
- [design/stitch/](./design/stitch/) — “Daykodee Supplies White” mockups (screenshots; HTML where available)
- `public/daykodee-logo-trim.png` — logo to use in the site header
- `.env.example` — `VITE_WIX_CLIENT_ID` placeholder (no secrets)

## Hosting

- Public GitHub repo: `SamBar1106/daykodee-supplies` (this repo). Public so GitHub Pages can stay on the free plan.
- Later preview: `https://sambar1106.github.io/daykodee-supplies/` (project Pages, no custom domain yet).
- Later live URL: `https://supplies.daykodee.com/` — DNS and Pages custom domain are tickets SUP-003 and SUP-005. **Do not add a `CNAME` file and do not enable a custom domain until Samuel’s go-live OK.**
- Policy also wants a private Gitea repo that push-mirrors here. Gitea at `desktop-2p168ve.tail716e97.ts.net:3443` was unreachable from the seed environment (TLS error). See KANBAN.md.

## Rules

- No secrets, API keys, tokens, or client personal data in this repo.
- Do not publish the live site, buy anything, or send messages as part of the seed.
- The public store on daykodee.com is unchanged. This site must not link to or from it.
