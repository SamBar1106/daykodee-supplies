import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Shell } from "../components/Shell.jsx";
import { bodyOf, inStock, optionSummary, specRows, unitPrice, variantLabel } from "../lib/catalog.js";
import { formatMoney, toAmount } from "../lib/money.js";
import { productImages } from "../lib/media.js";
import { useSession } from "../session.jsx";

export function ProductPage() {
  const { productId } = useParams();
  const session = useSession();
  const item = session.items.find((candidate) => candidate.id === productId || candidate.slug === productId);
  const variants = item?.variants?.length ? item.variants : [null];
  const [variantIndex, setVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const variant = variants[Math.min(variantIndex, variants.length - 1)] || null;
  const images = useMemo(() => (item ? productImages(item) : []), [item]);
  const stock = inStock(variant);
  const specs = specRows(variant);
  const price = item ? unitPrice(item, variant) : null;
  const compare = toAmount(item?.compareAtPrice);
  const amount = toAmount(price);

  if (!session.authReady || (session.catalogStatus === "loading" && !session.demo)) {
    return (
      <Shell screen="product" title="Product">
        <p className="status-card">Loading this item…</p>
      </Shell>
    );
  }
  if (!session.demo && session.catalogStatus === "unauthorized") return <Navigate to="/login" replace />;
  if (!session.demo && session.catalogStatus === "forbidden") return <Navigate to="/pending" replace />;

  async function add() {
    setNotice("");
    try {
      await session.addToCart(item, variant, quantity);
      setNotice("Added to your franchise cart.");
    } catch {
      setNotice(session.cartError || "This item could not be added.");
    }
  }

  return (
    <Shell screen="product" title={item?.name || "Product"}>
      <p className="crumbs">
        <Link to="/">Catalog</Link>
        <span aria-hidden="true">/</span>
        {item?.name || "Item"}
      </p>
      {!item ? (
        <section className="status-card">
          <h1>This item is not in the franchise catalog</h1>
          <p>It may have been removed, or this link is no longer valid.</p>
          <Link className="button button-outline" to="/">Back to catalog</Link>
        </section>
      ) : (
        <article className="pdp">
          <div className="gallery">
            <div className="gallery-main">
              {images[imageIndex] ? <img src={images[imageIndex]} alt="" /> : <span className="media-fallback" />}
            </div>
            {images.length > 1 ? (
              <div className="thumbs">
                {images.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    className={index === imageIndex ? "is-active" : ""}
                    onClick={() => setImageIndex(index)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={url} alt="" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="pdp-copy">
            <div className="sku-row">
              {session.demo ? <span className="sample-badge">Sample</span> : <span />}
              {variant?.sku ? <p>SKU: {variant.sku}</p> : null}
            </div>
            <h1>{item.name}</h1>
            <p className="price-row">
              <strong>{formatMoney(price, item.currency)}</strong>
              {compare && amount !== null && compare > amount ? (
                <s>{formatMoney(compare, item.currency)}</s>
              ) : null}
              <span>/ {optionSummary(variant)}</span>
            </p>
            <p className="price-note">Franchise price. {session.demo ? "Sample item for mockup only." : "Your approved rate."}</p>
            {bodyOf(item) ? <p className="description">{bodyOf(item)}</p> : null}
            {variants.length > 1 ? (
              <div className="variant-picker" role="radiogroup" aria-label="Options">
                {variants.map((option, index) => (
                  <button
                    key={option?.id || index}
                    type="button"
                    role="radio"
                    aria-checked={index === variantIndex}
                    className={index === variantIndex ? "is-active" : ""}
                    onClick={() => setVariantIndex(index)}
                  >
                    {variantLabel(option)}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="buy-row">
              <div className="stepper">
                <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
                <output aria-live="polite">{quantity}</output>
                <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(99, value + 1))}>+</button>
              </div>
              <button type="button" className="button button-gold" onClick={add} disabled={session.busy || stock === false}>
                Add to cart
              </button>
            </div>
            <p className={`stock-line ${stock === false ? "is-out" : ""}`}>
              <span className="gold-dot" aria-hidden="true" />
              {stock === false
                ? "Out of stock"
                : stock === null
                  ? "Availability is confirmed at checkout"
                  : "In stock at Central Distribution Hub · Ready for scheduled campus delivery"}
            </p>
            {notice ? <p className="form-note" role="status">{notice}</p> : null}
            {specs.length ? (
              <section className="specs">
                <h2>Product specifications</h2>
                <dl>
                  {specs.map((row) => (
                    <div key={row.name}>
                      <dt>{row.name}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
          </div>
        </article>
      )}
    </Shell>
  );
}
