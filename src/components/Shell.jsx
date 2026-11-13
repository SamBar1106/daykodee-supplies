import { useEffect, useId, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { memberDisplayName, memberInitials } from "../lib/wixClient.js";
import { publicAsset } from "../lib/paths.js";
import { useSession } from "../session.jsx";
import { CartIcon, LockIcon, ShieldIcon } from "./Icons.jsx";
import { LegalDialog } from "./LegalDialog.jsx";

const TITLES = {
  login: "Sign in",
  pending: "Pending approval",
  catalog: "Franchise catalog",
  product: "Product",
  cart: "Your order",
  thanks: "Order received",
  callback: "Finishing sign-in",
};

export function Shell({ screen, title, sessionNote, children }) {
  const session = useSession();
  const [legal, setLegal] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const name = memberDisplayName(session.member);
  const initials = memberInitials(session.member);
  const showNav = screen === "catalog" || screen === "product" || screen === "cart";

  useEffect(() => {
    document.title = `${title || TITLES[screen] || "Daykodee Supplies"} · Daykodee Supplies`;
  }, [screen, title]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onKey(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className={`site screen-${screen}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-bar">
          <Link className="brand" to={session.demo ? "/" : "/login"} aria-label="Daykodee Supplies home">
            <img src={publicAsset("daykodee-logo-trim.png")} alt="" />
            <span>Supplies</span>
          </Link>
          {showNav ? (
            <nav className="main-nav" aria-label="Portal">
              <NavLink to="/" end>
                Catalog
              </NavLink>
              <NavLink to="/cart">
                <CartIcon />
                Cart
                {session.cartCount > 0 ? <span className="cart-count">{session.cartCount}</span> : null}
              </NavLink>
              <div className="account-slot">
                <button
                  type="button"
                  className="account-chip"
                  aria-expanded={menuOpen}
                  aria-controls={menuId}
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <span className="avatar" aria-hidden="true">{initials}</span>
                  <span className="account-name">
                    {screen === "cart" ? <span className="account-prefix">Account (</span> : null}
                    {name}
                    {screen === "cart" ? <span className="account-prefix">)</span> : null}
                  </span>
                </button>
                {menuOpen ? (
                  <div className="account-menu" id={menuId} role="menu">
                    <p>{session.member?.loginEmail || "Franchise account"}</p>
                    <button type="button" role="menuitem" onClick={session.signOut}>
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </nav>
          ) : null}
          {screen === "login" || screen === "callback" || screen === "thanks" ? (
            <p className="portal-mark">
              <ShieldIcon />
              <span className="mark-long">B2B franchise portal</span>
              <span className="mark-short">B2B portal</span>
            </p>
          ) : null}
          {screen === "pending" ? (
            <div className="header-tools">
              <span className="portal-pill">B2B portal</span>
              <button type="button" className="ghost-light" onClick={session.signOut}>
                Sign out
              </button>
            </div>
          ) : null}
          {screen === "cart" ? (
            <button type="button" className="text-light sign-out-link" onClick={session.signOut}>
              Sign out
            </button>
          ) : null}
        </div>
        <FranchiseBanner screen={screen} sessionNote={sessionNote} name={name} demo={session.demo} />
      </header>
      {session.demo && screen !== "callback" ? (
        <p className="demo-strip">Sample preview for review. Prices and products are placeholders until sign-in is connected.</p>
      ) : null}
      <main id="main" className="page-main">
        {children}
      </main>
      <footer className="site-footer">
        <div className="footer-brand">
          <img src={publicAsset("daykodee-logo-trim.png")} alt="" />
          <strong>Daykodee Supplies</strong>
        </div>
        <p>© {new Date().getFullYear()} Daykodee Supplies. Authorized Family Affair franchise owners only.</p>
        <nav aria-label="Portal policies">
          <button type="button" onClick={() => setLegal("support")}>Franchise Support</button>
          <button type="button" onClick={() => setLegal("terms")}>Portal Terms</button>
          <button type="button" onClick={() => setLegal("privacy")}>Privacy</button>
        </nav>
      </footer>
      <LegalDialog kind={legal} onClose={() => setLegal(null)} />
    </div>
  );
}

function FranchiseBanner({ screen, sessionNote, name, demo }) {
  if (screen === "product") {
    return (
      <div className="franchise-banner banner-notice">
        <p>
          <span className="notice-pill">Notice</span>
          <strong>Franchise owners only</strong>
          <span>Authorized purchasing portal for active center licenses</span>
        </p>
        <p className="session-note">{sessionNote || (demo ? "Authenticated session: FA-DIRECT-7824" : `Signed in as ${name}`)}</p>
      </div>
    );
  }
  if (screen === "catalog") {
    return (
      <div className="franchise-banner banner-rates">
        <p>
          <LockIcon />
          <strong>Franchise owners only</strong>
          <span>— authorized access required. Contract rates active.</span>
        </p>
        <p className="banner-aside">Family Affair Childcare Network</p>
      </div>
    );
  }
  if (screen === "pending" || screen === "cart") {
    return (
      <div className="franchise-banner banner-on-blue">
        <p>
          <span className="gold-dot" aria-hidden="true" />
          <strong>Franchise owners only</strong>
          <span>— authorized wholesale access portal</span>
        </p>
      </div>
    );
  }
  const short = screen === "login";
  return (
    <div className="franchise-banner banner-gold">
      <p>
        <LockIcon />
        <strong>Franchise owners only</strong>
        <span className="banner-long"> — authorized directors & operators</span>
        {short ? <span className="banner-short"> — authorized directors</span> : null}
      </p>
    </div>
  );
}

export function LoadingScreen({ label = "Checking your franchise access…" }) {
  return (
    <Shell screen="callback">
      <section className="status-card" aria-live="polite">
        <p>{label}</p>
      </section>
    </Shell>
  );
}
