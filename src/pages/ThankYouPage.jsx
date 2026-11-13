import { Link, useSearchParams } from "react-router-dom";
import { Shell } from "../components/Shell.jsx";

export function ThankYouPage() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const demo = params.get("demo") === "1";

  return (
    <Shell screen="thanks">
      <section className="auth-card thanks-card">
        <p className="status-pill"><span className="gold-dot" aria-hidden="true" /> {demo ? "Sample confirmation" : "Order received"}</p>
        <h1>{demo ? "This is a preview of the thank-you page" : "Thank you for your franchise order"}</h1>
        <p className="lede">
          {demo
            ? "No order was placed. Checkout on the live portal returns here after Wix finishes payment."
            : "Wix has the payment. A Daykodee coordinator will follow the usual franchise fulfillment path."}
        </p>
        {orderId ? <p className="order-id">Order {orderId}</p> : null}
        <Link className="button button-gold button-block" to="/">Back to the catalog</Link>
      </section>
    </Shell>
  );
}
