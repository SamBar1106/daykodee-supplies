import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Shell } from "../components/Shell.jsx";
import { ProductCard } from "../components/ProductCard.jsx";
import { categoriesFor, categoryOf } from "../lib/catalog.js";
import { useSession } from "../session.jsx";

export function CatalogPage() {
  const session = useSession();
  const [filter, setFilter] = useState("All");
  const [supportOpen, setSupportOpen] = useState(false);
  const categories = useMemo(() => categoriesFor(session.items), [session.items]);
  const visible = session.items.filter((item) => filter === "All" || categoryOf(item).includes(filter));

  if (!session.authReady) {
    return (
      <Shell screen="catalog">
        <p className="status-card">Checking your franchise access…</p>
      </Shell>
    );
  }
  if (!session.demo && session.catalogStatus === "unauthorized") return <Navigate to="/login" replace />;
  if (!session.demo && session.catalogStatus === "forbidden") return <Navigate to="/pending" replace />;
  if (!session.demo && session.catalogStatus === "unconfigured") return <Navigate to="/login" replace />;

  return (
    <Shell screen="catalog">
      <section className="bulletin">
        <div>
          <p>Franchise network bulletin</p>
          <h2>April classroom restock — sample promotion</h2>
          <span>Franchise pricing on rest mats and paint packs through April 30. Sample promotion for this mockup only.</span>
        </div>
        <a className="button button-gold" href="#catalog-grid">View eligible items</a>
      </section>
      <div className="catalog-heading">
        <div>
          <h1>Franchise catalog</h1>
          <p>These products and prices are for approved franchise owners only.</p>
        </div>
        <div className="filters" role="tablist" aria-label="Catalog groups">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={filter === category}
              className={filter === category ? "is-active" : ""}
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      {session.catalogStatus === "error" ? (
        <section className="status-card" role="alert">
          <h2>The catalog is unavailable</h2>
          <p>
            {session.catalogReason === "network"
              ? "The franchise catalog could not be reached. On the GitHub Pages preview, that origin still needs to be added to the API allowlist."
              : "The catalog service had a problem. Try again shortly."}
          </p>
        </section>
      ) : null}
      {session.catalogStatus === "ok" && visible.length === 0 ? (
        <section className="status-card">
          <h2>No items in this group</h2>
          <p>Try another group, or check back after the next franchise restock.</p>
        </section>
      ) : null}
      <div className="product-grid" id="catalog-grid">
        {visible.map((item) => (
          <ProductCard key={item.id || item.slug} item={item} showSample={session.demo} />
        ))}
      </div>
      <section className="assist-bar">
        <p>
          <strong>Need scheduled recurring restocks or custom order quotes?</strong>
          <span>Contact the Daykodee supply desk for franchise procurement help.</span>
        </p>
        <button type="button" className="button button-outline" onClick={() => setSupportOpen(true)}>
          Contact Franchise Support
        </button>
      </section>
      {supportOpen ? (
        <p className="support-note" role="status">
          Use the contact on your franchise agreement. This portal does not open the public store.
          <button type="button" className="text-button" onClick={() => setSupportOpen(false)}>Dismiss</button>
        </p>
      ) : null}
    </Shell>
  );
}
