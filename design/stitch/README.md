# Daykodee Supplies White — Stitch mockups

Stitch project: [Daykodee E-Commerce Storefront](https://stitch.withgoogle.com/projects/12072481528278694360) (`12072481528278694360`).
Design system: **Daykodee Supplies White** (pure white canvas, royal blue `#0A3A9E`, gold `#D4A017`, Plus Jakarta Sans, persistent “FRANCHISE OWNERS ONLY” banner).

These seven screens were exported on Nov 12, 2026, 8:05 AM CT and are the design source for SUP-001. Sample product names, prices, and the sample email on the sign-in screen are placeholders, not real client data.

| File | Screen | Viewport |
|---|---|---|
| `01-desktop-sign-in.png` | Sign in (email/password + Continue with Google) | Desktop |
| `02-desktop-pending-approval.png` | Pending approval / not yet a franchisee | Desktop |
| `03-desktop-catalog.png` | Franchise catalog (product grid) | Desktop |
| `04-desktop-product-detail.png` | Product detail | Desktop |
| `05-desktop-cart.png` | Cart / checkout summary | Desktop |
| `06-mobile-sign-in.png` | Sign in | Mobile |
| `07-mobile-catalog.png` | Franchise catalog | Mobile |

Plan v3 also expects `/callback` (OAuth return, no marketing UI) and `/thank-you` (after Wix-hosted checkout). Those two are not in the seven Stitch screens; implement them simply, in the same white / blue / gold style, with the franchise-only banner.

### HTML export note

`list_screens` on this Stitch project only returns the four public-store canvas screens (Home, Shop Catalog, Product Detail, Cart). The Supplies White screens sit off-canvas. One Supplies screen ID was recovered and fetched: **Daykodee Supplies — Product Detail** (`projects/12072481528278694360/screens/743ea6a39c8b4f79b7163120e192ac5c`). The HTML download came back truncated by the export tool, so it is **not** committed here (a partial file is worse than none). Use the PNGs above, plus the design-system rules in BUILD-BRIEF.md, as the source of truth. If full HTML is needed later, open the Stitch project, surface the seven off-canvas screens, and re-export.
