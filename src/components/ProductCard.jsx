import { useState } from "react";
import { Link } from "react-router-dom";
import { formatMoney } from "../lib/money.js";
import { imageUrl } from "../lib/media.js";
import { subtitleOf, unitPrice } from "../lib/catalog.js";
import { useSession } from "../session.jsx";

export function ProductCard({ item, showSample }) {
  const session = useSession();
  const [added, setAdded] = useState(false);
  const [failed, setFailed] = useState(false);
  const image = imageUrl(item.mainImage);
  const price = unitPrice(item, item.variants?.[0]);

  async function add(event) {
    event.preventDefault();
    setFailed(false);
    try {
      await session.addToCart(item, item.variants?.[0] || null, 1);
      setAdded(true);
    } catch {
      setFailed(true);
    }
  }

  return (
    <article className="product-card">
      <Link className="product-media" to={`/product/${item.id}`}>
        {image ? <img src={image} alt="" /> : <span className="media-fallback" aria-hidden="true" />}
        {showSample ? <span className="sample-badge">Sample</span> : null}
      </Link>
      <div className="product-body">
        <h3>
          <Link to={`/product/${item.id}`}>{item.name || "Franchise item"}</Link>
        </h3>
        {subtitleOf(item) ? <p>{subtitleOf(item)}</p> : null}
        <div className="product-buy">
          <p>
            <span>Franchise price</span>
            <strong>{formatMoney(price, item.currency)}</strong>
          </p>
          <button type="button" className="button button-gold button-compact" onClick={add} disabled={session.busy}>
            {added ? "Added" : "Add to cart"}
          </button>
        </div>
        {failed ? <p className="form-error" role="alert">{session.cartError}</p> : null}
      </div>
    </article>
  );
}
