import { Link, Navigate } from "react-router-dom";
import { Shell } from "../components/Shell.jsx";
import { TrashIcon } from "../components/Icons.jsx";
import { formatMoney } from "../lib/money.js";
import { memberDisplayName } from "../lib/wixClient.js";
import { useSession } from "../session.jsx";

export function CartPage() {
  const session = useSession();
  const currency = session.cartLines[0]?.currency || "USD";
  const subtotal = session.cartLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const account = session.demo ? "Austin South #104" : memberDisplayName(session.member);

  if (!session.authReady) {
    return (
      <Shell screen="cart">
        <p className="status-card">Loading your order…</p>
      </Shell>
    );
  }
  if (!session.demo && (session.catalogStatus === "unauthorized" || session.catalogStatus === "unconfigured")) {
    return <Navigate to="/login" replace />;
  }
  if (!session.demo && session.catalogStatus === "forbidden") return <Navigate to="/pending" replace />;

  return (
    <Shell screen="cart">
      <Link className="back-link" to="/">← Back to Catalog</Link>
      <div className="cart-heading">
        <div>
          <h1>Your order</h1>
          <p>Review your franchise items, then continue to secure checkout.</p>
        </div>
        <p className="account-pill">Franchise account: <strong>{account}</strong></p>
      </div>
      {session.cartLines.length === 0 ? (
        <section className="status-card">
          <h2>Your cart is empty</h2>
          <p>Add franchise items from the catalog. Checkout stays on Wix.</p>
          <Link className="button button-gold" to="/">Continue shopping</Link>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-lines" aria-label="Items">
            <header>
              <span>Items ({session.cartLines.length})</span>
              <span>Pack / option</span>
              <span>Quantity</span>
              <span>Line total</span>
            </header>
            {session.cartLines.map((line) => (
              <article key={line.id}>
                <div className="line-main">
                  <div className="line-image">
                    {line.image ? <img src={line.image} alt="" /> : <span className="media-fallback" />}
                  </div>
                  <div>
                    <h2>
                      {line.productId ? <Link to={`/product/${line.productId}`}>{line.name}</Link> : line.name}
                    </h2>
                    {session.demo ? <span className="sample-badge">Sample</span> : null}
                    <p>{line.sku ? `SKU: ${line.sku}` : line.optionLabel}</p>
                  </div>
                </div>
                <p className="line-pack">
                  {line.optionLabel}
                  <span>{formatMoney(line.unitPrice, line.currency)} ea</span>
                </p>
                <div className="stepper">
                  <button type="button" aria-label={`Decrease ${line.name}`} onClick={() => session.changeQuantity(line.id, line.quantity - 1)} disabled={line.quantity <= 1 || session.busy}>−</button>
                  <output>{line.quantity}</output>
                  <button type="button" aria-label={`Increase ${line.name}`} onClick={() => session.changeQuantity(line.id, line.quantity + 1)} disabled={session.busy}>+</button>
                </div>
                <strong className="line-total">{formatMoney(line.unitPrice * line.quantity, line.currency)}</strong>
                <div className="line-foot">
                  <span>{line.note}</span>
                  <button type="button" className="text-button" onClick={() => session.removeFromCart(line.id)} disabled={session.busy}>
                    <TrashIcon /> Remove
                  </button>
                </div>
              </article>
            ))}
            <Link className="back-link" to="/">← Continue shopping wholesale catalog</Link>
            <ul className="assurance">
              <li>Tax-exempt certification applied at checkout when it is on the account</li>
              <li>Direct franchise logistics</li>
              <li>Net-30 payment when the Wix checkout offers it</li>
            </ul>
          </section>
          <aside className="summary">
            <header>
              <h2>Order Summary</h2>
              <span>{session.cartCount} items</span>
            </header>
            <dl>
              <div><dt>Subtotal</dt><dd>{formatMoney(subtotal, currency)}</dd></div>
              <div><dt>Franchise wholesale tier</dt><dd><span className="ship-pill">Free ground shipping</span></dd></div>
              <div><dt>Shipping</dt><dd>Calculated at checkout</dd></div>
              <div><dt>Estimated tax</dt><dd>Calculated at checkout</dd></div>
            </dl>
            <div className="summary-total">
              <span>Total</span>
              <strong>{formatMoney(subtotal, currency)}</strong>
              <small>USD, excluding applicable taxes</small>
            </div>
            <p className="summary-note">Franchise prices. {session.demo ? "Sample order for mockup only. No order is placed from this preview." : "The actual invoice reflects the franchise tier."}</p>
            {session.cartError ? <p className="form-error" role="alert">{session.cartError}</p> : null}
            <button type="button" className="button button-gold button-block" onClick={session.checkout} disabled={session.busy}>
              Continue to checkout
            </button>
            <p className="fine-print">You will complete payment on the secure Wix checkout page.</p>
          </aside>
        </div>
      )}
    </Shell>
  );
}
